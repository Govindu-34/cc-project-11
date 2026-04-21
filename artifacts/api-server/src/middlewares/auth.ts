import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    employeeId?: number;
  }
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  avatarColor: string;
  accountRole: "admin" | "user";
  createdAt: Date;
};

export async function loadUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const id = req.session?.employeeId;
  if (id) {
    const [row] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id));
    if (row) {
      (req as Request & { user?: SessionUser }).user = {
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
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as Request & { user?: SessionUser }).user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as Request & { user?: SessionUser }).user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (user.accountRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function getUser(req: Request): SessionUser | undefined {
  return (req as Request & { user?: SessionUser }).user;
}
