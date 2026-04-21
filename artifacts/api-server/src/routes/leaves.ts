import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, leaveRequestsTable, employeesTable } from "@workspace/db";
import {
  CreateLeaveBody,
  ListLeavesResponse,
  ListMyLeavesResponse,
  ApproveLeaveResponse,
  RejectLeaveResponse,
  ListLeavesQueryParams,
  ApproveLeaveParams,
  RejectLeaveParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, getUser } from "../middlewares/auth";

const router: IRouter = Router();

function toRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    startDate: row.startDate,
    endDate: row.endDate,
    reason: row.reason,
    status: row.status,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

router.get("/leaves", requireAdmin, async (req, res): Promise<void> => {
  const params = ListLeavesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      id: leaveRequestsTable.id,
      employeeId: leaveRequestsTable.employeeId,
      employeeName: employeesTable.name,
      startDate: leaveRequestsTable.startDate,
      endDate: leaveRequestsTable.endDate,
      reason: leaveRequestsTable.reason,
      status: leaveRequestsTable.status,
      decidedBy: leaveRequestsTable.decidedBy,
      decidedAt: leaveRequestsTable.decidedAt,
      createdAt: leaveRequestsTable.createdAt,
    })
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, leaveRequestsTable.employeeId))
    .where(params.data.status ? eq(leaveRequestsTable.status, params.data.status) : undefined)
    .orderBy(desc(leaveRequestsTable.createdAt));
  res.json(ListLeavesResponse.parse(rows.map(toRecord)));
});

router.get("/leaves/my", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const rows = await db
    .select({
      id: leaveRequestsTable.id,
      employeeId: leaveRequestsTable.employeeId,
      employeeName: employeesTable.name,
      startDate: leaveRequestsTable.startDate,
      endDate: leaveRequestsTable.endDate,
      reason: leaveRequestsTable.reason,
      status: leaveRequestsTable.status,
      decidedBy: leaveRequestsTable.decidedBy,
      decidedAt: leaveRequestsTable.decidedAt,
      createdAt: leaveRequestsTable.createdAt,
    })
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, leaveRequestsTable.employeeId))
    .where(eq(leaveRequestsTable.employeeId, user.id))
    .orderBy(desc(leaveRequestsTable.createdAt));
  res.json(ListMyLeavesResponse.parse(rows.map(toRecord)));
});

router.post("/leaves", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req)!;
  const parsed = CreateLeaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.endDate < parsed.data.startDate) {
    res.status(400).json({ error: "End date must be on or after start date" });
    return;
  }
  const toDateStr = (d: Date | string) =>
    typeof d === "string" ? d : d.toISOString().slice(0, 10);
  const [row] = await db
    .insert(leaveRequestsTable)
    .values({
      employeeId: user.id,
      startDate: toDateStr(parsed.data.startDate),
      endDate: toDateStr(parsed.data.endDate),
      reason: parsed.data.reason,
    })
    .returning();
  res.status(201).json({ ...toRecord(row), employeeName: user.name });
});

async function decide(
  id: number,
  status: "approved" | "rejected",
  adminId: number,
) {
  const [row] = await db
    .update(leaveRequestsTable)
    .set({ status, decidedBy: adminId, decidedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!row) return null;
  const [emp] = await db
    .select({ name: employeesTable.name })
    .from(employeesTable)
    .where(eq(employeesTable.id, row.employeeId));
  return { ...toRecord(row), employeeName: emp?.name ?? "" };
}

router.post("/leaves/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const params = ApproveLeaveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await decide(params.data.id, "approved", getUser(req)!.id);
  if (!result) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  res.json(ApproveLeaveResponse.parse(result));
});

router.post("/leaves/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const params = RejectLeaveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await decide(params.data.id, "rejected", getUser(req)!.id);
  if (!result) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  res.json(RejectLeaveResponse.parse(result));
});

export default router;
