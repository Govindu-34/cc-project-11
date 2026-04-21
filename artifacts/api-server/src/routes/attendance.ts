import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc, type SQL } from "drizzle-orm";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import {
  CheckInBody,
  CheckOutBody,
  UpdateAttendanceBody,
  UpdateAttendanceParams,
  DeleteAttendanceParams,
  ListAttendanceQueryParams,
  ListAttendanceResponse,
  GetTodayAttendanceResponse,
  CheckInResponse,
  CheckOutResponse,
  UpdateAttendanceResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.use("/attendance", requireAdmin);

router.get("/attendance/export", async (req, res): Promise<void> => {
  const fromStr = typeof req.query.from === "string" ? req.query.from : undefined;
  const toStr = typeof req.query.to === "string" ? req.query.to : undefined;
  const conditions: SQL[] = [];
  if (fromStr) conditions.push(gte(attendanceTable.date, fromStr));
  if (toStr) conditions.push(lte(attendanceTable.date, toStr));
  const rows = await db
    .select({
      date: attendanceTable.date,
      employeeName: employeesTable.name,
      email: employeesTable.email,
      department: employeesTable.department,
      role: employeesTable.role,
      status: attendanceTable.status,
      checkInTime: attendanceTable.checkInTime,
      checkOutTime: attendanceTable.checkOutTime,
      notes: attendanceTable.notes,
    })
    .from(attendanceTable)
    .leftJoin(employeesTable, eq(employeesTable.id, attendanceTable.employeeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(attendanceTable.date), employeesTable.name);

  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = [
    "date","employee","email","department","role","status","check_in","check_out","notes",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.date, r.employeeName, r.email, r.department, r.role,
      r.status, r.checkInTime, r.checkOutTime, r.notes,
    ].map(escape).join(","));
  }
  const csv = lines.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="attendance-${stamp}.csv"`);
  res.send(csv);
});

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function lateThreshold(): Date {
  // 9:15 AM local server time today
  const t = new Date();
  t.setHours(9, 15, 0, 0);
  return t;
}

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const toDateStr = (d: Date | string): string =>
    typeof d === "string" ? d : d.toISOString().slice(0, 10);
  const conditions: SQL[] = [];
  if (params.data.date)
    conditions.push(eq(attendanceTable.date, toDateStr(params.data.date)));
  if (params.data.employeeId)
    conditions.push(eq(attendanceTable.employeeId, params.data.employeeId));
  if (params.data.from)
    conditions.push(gte(attendanceTable.date, toDateStr(params.data.from)));
  if (params.data.to)
    conditions.push(lte(attendanceTable.date, toDateStr(params.data.to)));

  const rows = await db
    .select()
    .from(attendanceTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(attendanceTable.date), desc(attendanceTable.createdAt));
  res.json(ListAttendanceResponse.parse(rows));
});

router.get("/attendance/today", async (_req, res): Promise<void> => {
  const today = todayStr();
  const rows = await db
    .select({
      id: attendanceTable.id,
      employeeId: attendanceTable.employeeId,
      date: attendanceTable.date,
      status: attendanceTable.status,
      checkInTime: attendanceTable.checkInTime,
      checkOutTime: attendanceTable.checkOutTime,
      notes: attendanceTable.notes,
      createdAt: attendanceTable.createdAt,
      employee: employeesTable,
    })
    .from(attendanceTable)
    .innerJoin(employeesTable, eq(employeesTable.id, attendanceTable.employeeId))
    .where(eq(attendanceTable.date, today))
    .orderBy(desc(attendanceTable.checkInTime));
  res.json(GetTodayAttendanceResponse.parse(rows));
});

router.get("/attendance/recent", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const limit = params.data.limit ?? 10;
  const rows = await db
    .select()
    .from(attendanceTable)
    .innerJoin(employeesTable, eq(employeesTable.id, attendanceTable.employeeId))
    .orderBy(desc(attendanceTable.createdAt))
    .limit(limit * 2);

  const activity: Array<{
    id: number;
    employeeId: number;
    employeeName: string;
    department: string;
    avatarColor?: string;
    action: "check_in" | "check_out";
    timestamp: string;
  }> = [];
  for (const r of rows) {
    if (r.attendance.checkOutTime) {
      activity.push({
        id: r.attendance.id * 10 + 2,
        employeeId: r.employees.id,
        employeeName: r.employees.name,
        department: r.employees.department,
        avatarColor: r.employees.avatarColor,
        action: "check_out",
        timestamp: r.attendance.checkOutTime.toISOString(),
      });
    }
    if (r.attendance.checkInTime) {
      activity.push({
        id: r.attendance.id * 10 + 1,
        employeeId: r.employees.id,
        employeeName: r.employees.name,
        department: r.employees.department,
        avatarColor: r.employees.avatarColor,
        action: "check_in",
        timestamp: r.attendance.checkInTime.toISOString(),
      });
    }
  }
  activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(GetRecentActivityResponse.parse(activity.slice(0, limit)));
});

router.post("/attendance/check-in", async (req, res): Promise<void> => {
  const parsed = CheckInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const today = todayStr();
  const now = new Date();
  const status = now > lateThreshold() ? "late" : "present";

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.employeeId, parsed.data.employeeId),
        eq(attendanceTable.date, today),
      ),
    );

  let row;
  if (existing) {
    [row] = await db
      .update(attendanceTable)
      .set({
        status,
        checkInTime: now,
        notes: parsed.data.notes ?? existing.notes,
      })
      .where(eq(attendanceTable.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(attendanceTable)
      .values({
        employeeId: parsed.data.employeeId,
        date: today,
        status,
        checkInTime: now,
        notes: parsed.data.notes,
      })
      .returning();
  }
  res.json(CheckInResponse.parse(row));
});

router.post("/attendance/check-out", async (req, res): Promise<void> => {
  const parsed = CheckOutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const today = todayStr();
  const now = new Date();

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.employeeId, parsed.data.employeeId),
        eq(attendanceTable.date, today),
      ),
    );

  let row;
  if (existing) {
    [row] = await db
      .update(attendanceTable)
      .set({
        checkOutTime: now,
        notes: parsed.data.notes ?? existing.notes,
      })
      .where(eq(attendanceTable.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(attendanceTable)
      .values({
        employeeId: parsed.data.employeeId,
        date: today,
        status: "present",
        checkInTime: now,
        checkOutTime: now,
        notes: parsed.data.notes,
      })
      .returning();
  }
  res.json(CheckOutResponse.parse(row));
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const params = UpdateAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(attendanceTable)
    .set(parsed.data)
    .where(eq(attendanceTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  res.json(UpdateAttendanceResponse.parse(row));
});

router.delete("/attendance/:id", async (req, res): Promise<void> => {
  const params = DeleteAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(attendanceTable)
    .where(eq(attendanceTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
