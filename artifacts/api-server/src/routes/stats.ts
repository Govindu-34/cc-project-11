import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import {
  GetStatsSummaryResponse,
  GetStatsByDepartmentResponse,
  GetWeeklyTrendResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.use("/stats", requireAdmin);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const today = todayStr();
  const [{ count: totalEmployees }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employeesTable);

  const todayRows = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));

  let presentToday = 0,
    lateToday = 0,
    onLeaveToday = 0;
  let checkInTotalMs = 0;
  let checkInCount = 0;
  for (const r of todayRows) {
    if (r.status === "present") presentToday++;
    else if (r.status === "late") lateToday++;
    else if (r.status === "on_leave") onLeaveToday++;
    if (r.checkInTime) {
      const d = new Date(r.checkInTime);
      checkInTotalMs +=
        d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000;
      checkInCount++;
    }
  }
  const counted = presentToday + lateToday + onLeaveToday;
  const absentToday = Math.max(0, totalEmployees - counted);
  const attendanceRate =
    totalEmployees > 0
      ? Math.round(((presentToday + lateToday) / totalEmployees) * 1000) / 10
      : 0;

  let averageCheckInTime: string | null = null;
  if (checkInCount > 0) {
    const avgMs = Math.round(checkInTotalMs / checkInCount);
    const h = Math.floor(avgMs / 3600000);
    const m = Math.floor((avgMs % 3600000) / 60000);
    averageCheckInTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  res.json(
    GetStatsSummaryResponse.parse({
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      onLeaveToday,
      attendanceRate,
      averageCheckInTime,
    }),
  );
});

router.get("/stats/by-department", async (_req, res): Promise<void> => {
  const today = todayStr();
  const employees = await db.select().from(employeesTable);
  const todayRows = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.date, today));
  const recordByEmp = new Map<number, (typeof todayRows)[number]>();
  for (const r of todayRows) recordByEmp.set(r.employeeId, r);

  const map = new Map<
    string,
    { department: string; total: number; present: number; late: number; absent: number; onLeave: number }
  >();
  for (const e of employees) {
    const cur =
      map.get(e.department) ??
      { department: e.department, total: 0, present: 0, late: 0, absent: 0, onLeave: 0 };
    cur.total++;
    const rec = recordByEmp.get(e.id);
    if (!rec) cur.absent++;
    else if (rec.status === "present") cur.present++;
    else if (rec.status === "late") cur.late++;
    else if (rec.status === "on_leave") cur.onLeave++;
    else cur.absent++;
    map.set(e.department, cur);
  }
  const arr = Array.from(map.values()).sort((a, b) =>
    a.department.localeCompare(b.department),
  );
  res.json(GetStatsByDepartmentResponse.parse(arr));
});

router.get("/stats/weekly-trend", async (_req, res): Promise<void> => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const start = days[0];
  const end = days[days.length - 1];
  const rows = await db
    .select()
    .from(attendanceTable)
    .where(and(gte(attendanceTable.date, start), lte(attendanceTable.date, end)));

  const trend = days.map((date) => ({
    date,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
  }));
  const idx = new Map(days.map((d, i) => [d, i]));
  for (const r of rows) {
    const i = idx.get(r.date);
    if (i === undefined) continue;
    if (r.status === "present") trend[i].present++;
    else if (r.status === "late") trend[i].late++;
    else if (r.status === "on_leave") trend[i].onLeave++;
    else trend[i].absent++;
  }
  res.json(GetWeeklyTrendResponse.parse(trend));
});

export default router;
