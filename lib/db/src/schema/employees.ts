import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  role: text("role").notNull(),
  avatarColor: text("avatar_color").notNull().default("#7c3aed"),
  passwordHash: text("password_hash").notNull().default(""),
  accountRole: text("account_role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Employee = typeof employeesTable.$inferSelect;
export type InsertEmployee = typeof employeesTable.$inferInsert;
