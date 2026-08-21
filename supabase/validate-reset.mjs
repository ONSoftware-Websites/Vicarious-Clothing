import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const base = path.resolve("supabase");
const schema = fs.readFileSync(path.join(base, "schema.sql"), "utf-8");
const seed = fs.readFileSync(path.join(base, "seed.sql"), "utf-8");
const reset = fs.readFileSync(path.join(base, "reset.sql"), "utf-8");

async function run() {
  const db = new PGlite();

  // PGlite needs the auth schema to exist before we can create triggers on auth.users
  console.log("=== Ensuring auth schema exists ===");
  await db.exec("create schema if not exists auth;");

  console.log("=== Applying schema.sql ===");
  await db.exec(schema);
  let tables = (await db.query("select count(*) as cnt from information_schema.tables where table_schema='public'")).cnt;
  console.log("Tables after schema:", tables);

  console.log("=== Applying seed.sql ===");
  await db.exec(seed);
  tables = (await db.query("select count(*) as cnt from information_schema.tables where table_schema='public'")).cnt;
  console.log("Tables after seed:", tables);

  // Check enum types count
  const enums = await db.query(
    "select count(*) as cnt from pg_type where typtype='e' and typname in ('condition_grade','inventory_status','order_status','lead_status','role_type','sales_channel','discount_type','purchase_status','email_status')"
  );
  console.log("Enum types after seed:", enums.cnt);

  console.log("=== Running reset.sql ===");
  await db.exec(reset);

  tables = (await db.query("select count(*) as cnt from information_schema.tables where table_schema='public'")).cnt;
  console.log("Tables after reset:", tables);

  enums = await db.query(
    "select count(*) as cnt from pg_type where typtype='e' and typname in ('condition_grade','inventory_status','order_status','lead_status','role_type','sales_channel','discount_type','purchase_status','email_status')"
  );
  console.log("Enum types after reset:", enums.cnt);

  console.log("=== Re-applying schema.sql ===");
  await db.exec(schema);
  tables = (await db.query("select count(*) as cnt from information_schema.tables where table_schema='public'")).cnt;
  console.log("Tables after re-schema:", tables);

  console.log("Done.");
}

run().catch(err => { console.error(err); process.exit(1); });