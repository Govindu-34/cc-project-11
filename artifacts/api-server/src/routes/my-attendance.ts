import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, attendanceTable } from "@workspace/db";
import {
  MyCheckInBody,
  MyCheckOutBody,
  MyCheckInResponse,
  MyCheckOutResponse,
  GetMyTodayResponse,
  GetMyHistoryQueryParams,
  GetMyHistoryResponse,
} from "@workspace/api-zod";
import { requireAuth, getUser } from "../middlewares/auth";

const router: IRouter = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function lateThreshold(): Date {
  const t = new Date();
  t.setHours(9, 15, 0, 0);
  return t;
}

router.get("/attendance/my/today", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const today = todayStr();
  const [row] = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.employeeId, user.id),
        eq(attendanceTable.date, today),
      ),
    );
  res.json(GetMyTodayResponse.parse({ record: row ?? null }));
});

router.get("/attendance/my", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const params = GetMyHistoryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const limit = params.data.limit ?? 30;
  const rows = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.employeeId, user.id))
    .orderBy(desc(attendanceTable.date))
    .limit(limit);
  res.json(GetMyHistoryResponse.parse(rows));
});

router.post("/attendance/my/check-in", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const parsed = MyCheckInBody.safeParse(req.body ?? {});
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
      and(eq(attendanceTable.employeeId, user.id), eq(attendanceTable.date, today)),
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
        employeeId: user.id,
        date: today,
        status,
        checkInTime: now,
        notes: parsed.data.notes,
      })
      .returning();
  }
  res.json(MyCheckInResponse.parse(row));
});

router.post("/attendance/my/check-out", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const parsed = MyCheckOutBody.safeParse(req.body ?? {});
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
      and(eq(attendanceTable.employeeId, user.id), eq(attendanceTable.date, today)),
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
        employeeId: user.id,
        date: today,
        status: "present",
        checkInTime: now,
        checkOutTime: now,
        notes: parsed.data.notes,
      })
      .returning();
  }
  res.json(MyCheckOutResponse.parse(row));
});

export default router;
