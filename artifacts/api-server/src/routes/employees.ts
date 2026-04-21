import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
  GetEmployeeResponse,
  ListEmployeesResponse,
  UpdateEmployeeResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.use("/employees", requireAdmin);

router.get("/employees", async (req, res): Promise<void> => {
  const params = ListEmployeesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions: SQL[] = [];
  if (params.data.search) {
    conditions.push(ilike(employeesTable.name, `%${params.data.search}%`));
  }
  if (params.data.department) {
    conditions.push(eq(employeesTable.department, params.data.department));
  }
  const rows = await db
    .select()
    .from(employeesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(employeesTable.name);
  res.json(ListEmployeesResponse.parse(rows));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [row] = await db
    .insert(employeesTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email.trim().toLowerCase(),
      department: parsed.data.department,
      role: parsed.data.role,
      avatarColor: parsed.data.avatarColor ?? "#7c3aed",
      passwordHash,
      accountRole: parsed.data.accountRole ?? "user",
    })
    .returning();
  res.status(201).json(GetEmployeeResponse.parse(row));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(GetEmployeeResponse.parse(row));
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...rest } = parsed.data;
  const updateValues: Partial<typeof employeesTable.$inferInsert> = { ...rest };
  if (password) {
    updateValues.passwordHash = await bcrypt.hash(password, 10);
  }
  if (rest.email) {
    updateValues.email = rest.email.trim().toLowerCase();
  }
  const [row] = await db
    .update(employeesTable)
    .set(updateValues)
    .where(eq(employeesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(UpdateEmployeeResponse.parse(row));
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(employeesTable)
    .where(eq(employeesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
