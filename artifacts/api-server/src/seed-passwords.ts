import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";

async function main() {
  const rows = await db.select().from(employeesTable).orderBy(employeesTable.id);
  if (rows.length === 0) { console.log("no employees"); return; }
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);
  await db.update(employeesTable)
    .set({ accountRole: "admin", passwordHash: adminHash })
    .where(eq(employeesTable.id, rows[0].id));
  for (const r of rows.slice(1)) {
    await db.update(employeesTable)
      .set({ accountRole: "user", passwordHash: userHash })
      .where(eq(employeesTable.id, r.id));
  }
  console.log(`Admin: ${rows[0].email} / admin123`);
  for (const r of rows.slice(1)) console.log(`User : ${r.email} / user123`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
