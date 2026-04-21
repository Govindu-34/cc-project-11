import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { employeesTable } from "./employees";

export const attendanceTable = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employeesTable.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: text("status").notNull().default("absent"),
    checkInTime: timestamp("check_in_time", { withTimezone: true }),
    checkOutTime: timestamp("check_out_time", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    employeeDateUnique: uniqueIndex("attendance_employee_date_unique").on(
      table.employeeId,
      table.date,
    ),
  }),
);

export type Attendance = typeof attendanceTable.$inferSelect;
export type InsertAttendance = typeof attendanceTable.$inferInsert;
