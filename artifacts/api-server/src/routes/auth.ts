import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, employeesTable } from "@workspace/db";
import { AuthLoginBody, AuthLoginResponse, AuthMeResponse } from "@workspace/api-zod";
import { getUser, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toEmployee(row: typeof employeesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department,
    role: row.role,
    avatarColor: row.avatarColor,
    accountRole: row.accountRole === "admin" ? "admin" : "user",
    createdAt: row.createdAt,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.email, email));
  if (!row || !row.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.password, row.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  req.session.employeeId = row.id;
  res.json(AuthLoginResponse.parse({ employee: toEmployee(row) }));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [row] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, user.id));
  if (!row) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(AuthMeResponse.parse({ employee: toEmployee(row) }));
});

export default router;
