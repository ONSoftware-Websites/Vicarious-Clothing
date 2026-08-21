import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const schema = fs.readFileSync(
  new URL("./schema.sql", import.meta.url),
  "utf8"
);

const stubs = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb
);
create or replace function auth.uid() returns uuid
language sql as $$ select null::uuid $$;
`;

const db = new PGlite();
await db.exec(stubs);
await db.exec(schema);

const tables = await db.query(
  "select tablename from pg_tables where schemaname = 'public' order by tablename"
);
const policies = await db.query(
  "select count(*) as count from pg_policies where schemaname = 'public'"
);
const indexes = await db.query(
  "select count(*) as count from pg_indexes where schemaname = 'public' and indexname not like '%_pkey'"
);
const triggers = await db.query(
  "select count(*) as count from pg_trigger where tgname = 'on_auth_user_created'"
);

console.log("TABLES:", tables.rows.map((r) => r.tablename).join(", "));
console.log("POLICIES:", policies.rows[0].count);
console.log("INDEXES:", indexes.rows[0].count);
console.log("PROFILE TRIGGER:", triggers.rows[0].count);

const insertResults = await db.exec(`
  insert into brands (name, slug) values ('Carhartt', 'carhartt');
  insert into products (sku, slug, name, brand, category, size, condition, price)
  values ('VC-000001', 'vc-000001-carhartt-test', 'Test Jacket', 'Carhartt', 'jackets', 'M', 'very_good', 64.00);
  insert into inventory_locations (id, label) values ('A-01', 'Shelf A');
  insert into inventory_items (sku, status, location_id)
  values ('VC-000001', 'AVAILABLE', 'A-01');
  insert into orders (id, email, name, subtotal, total, address_line1, address_city, address_postcode)
  values ('VC-9999', 'test@example.com', 'Test Buyer', 64, 64, '1 Test Street', 'Leeds', 'LS1 1AA');
  insert into order_items (order_id, sku, name, brand, size, condition, price)
  values ('VC-9999', 'VC-000001', 'Test Jacket', 'Carhartt', 'M', 'very_good', 64);
  insert into journal_posts (id, slug, title, published) values ('post-1', 'hello', 'Hello', true);
  insert into newsletter_subscribers (email) values ('sub@example.com');
`);
const inserted = insertResults
  .filter((r) => r.command === "INSERT")
  .reduce((sum, r) => sum + (r.affectedRows ?? 0), 0);
console.log("SEED INSERTS:", inserted, "rows");

const query = await db.query(
  "select sku, brand, status from inventory_items join products using (sku) where sku = 'VC-000001'"
);
console.log("JOIN QUERY:", JSON.stringify(query.rows[0]));

await db.close();
console.log("SCHEMA VALID");
