import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

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

function sql(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const s = String(value).replaceAll("'", "''");
  return `'${s}'`;
}

function arr(values) {
  if (!values || values.length === 0) return "'{}'";
  return `array[${values.map((v) => sql(v)).join(", ")}]`;
}

const emitted = [];

function q(sqlText) {
  const result = db.exec(sqlText);
  const list = Array.isArray(result) ? result : [result];
  for (const r of list) {
    if (r instanceof Error) throw r;
  }
  emitted.push(sqlText.trim());
}

async function run() {
  const data = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), ".data", "store.json"), "utf-8")
  );

  for (const brand of [...new Set(data.products.map((p) => p.brand))]) {
    q(`insert into brands (name, slug) values (${sql(brand)}, ${sql(brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"))});`);
  }

  for (const location of [
    ...new Set(
      data.products.map((p) => p.location).filter((l) => l && l !== "OUT")
    ),
  ]) {
    q(`insert into inventory_locations (id, label) values (${sql(location)}, ${sql(location)});`);
  }

  for (const p of data.products) {
    q(`insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      ${sql(p.sku)}, ${sql(p.slug)}, ${sql(p.name)}, ${sql(p.brand)}, ${sql(p.category)},
      ${sql(p.size)}, ${sql(p.colour)}, ${sql(p.material)}, ${sql(p.condition)}, ${sql(p.conditionNotes)},
      ${sql(p.description)}, ${arr(p.defects)}, ${arr(p.tags)}, ${sql(p.price)},
      ${sql(p.compareAtPrice)}, ${sql(p.cost)}, ${sql(p.floorPrice)}, ${sql(Boolean(p.isPick))}, ${sql(Boolean(p.featured))}, ${sql(p.listedAt)}
    );`);
    q(`insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      ${sql(p.sku)}, ${sql(p.status)}, ${sql(p.location === "OUT" ? null : p.location)}, ${sql(p.reservedUntil)}, ${sql(p.soldAt)}, ${sql(p.acquisitionSource)}, ${sql(p.purchaseDate)}
    );`);
    p.images.forEach((img, i) => {
      q(`insert into product_images (product_sku, position, src, alt) values (${sql(p.sku)}, ${i}, ${sql(img.src)}, ${sql(img.alt)});`);
    });
    p.measurements.forEach((m) => {
      q(`insert into product_measurements (product_sku, label, value) values (${sql(p.sku)}, ${sql(m.label)}, ${sql(m.value)});`);
    });
    p.marketplace.forEach((m) => {
      q(`insert into product_marketplace (sku, channel, status) values (${sql(p.sku)}, ${sql(m.channel)}, ${sql(m.status)});`);
    });
  }

  for (const d of data.discounts) {
    q(`insert into discounts (id, code, type, value, description, min_basket, categories, expires_at, usage_limit, used_count, used_emails, active, created_at) values (
      ${sql(d.id)}, ${sql(d.code)}, ${sql(d.type)}, ${sql(d.value)}, ${sql(d.description)}, ${sql(d.minBasket)},
      ${arr(d.categories)}, ${sql(d.expiresAt)}, ${sql(d.usageLimit)}, ${sql(d.usedCount)}, ${arr(d.usedEmails)}, ${sql(Boolean(d.active))}, ${sql(d.createdAt)}
    );`);
  }

  for (const o of data.orders) {
    q(`insert into orders (id, email, name, status, subtotal, discount_code, discount_type, discount_description, discount_amount, delivery, total, channel, address_line1, address_line2, address_city, address_postcode, address_country, payment_provider, payment_intent_id, created_at, updated_at) values (
      ${sql(o.id)}, ${sql(o.email)}, ${sql(o.name)}, ${sql(o.status)}, ${sql(o.subtotal)},
      ${sql(o.discount?.code)}, ${sql(o.discount?.type)}, ${sql(o.discount?.description)}, ${sql(o.discount?.amount ?? 0)},
      ${sql(o.delivery)}, ${sql(o.total)}, ${sql(o.channel)}, ${sql(o.address.line1)}, ${sql(o.address.line2)},
      ${sql(o.address.city)}, ${sql(o.address.postcode)}, ${sql(o.address.country)},
      ${sql(o.paymentProvider)}, ${sql(o.paymentIntentId)}, ${sql(o.createdAt)}, ${sql(o.updatedAt)}
    );`);
    o.items.forEach((i) => {
      q(`insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        ${sql(o.id)}, ${sql(i.sku)}, ${sql(i.name)}, ${sql(i.brand)}, ${sql(i.size)}, ${sql(i.condition)}, ${sql(i.price)}, ${sql(i.image)}
      );`);
    });
  }

  for (const l of data.leads) {
    q(`insert into purchase_leads (id, name, email, brand, item_type, size, condition, notes, offer, status, created_at) values (
      ${sql(l.id)}, ${sql(l.name)}, ${sql(l.email)}, ${sql(l.brand)}, ${sql(l.itemType)}, ${sql(l.size)}, ${sql(l.condition)}, ${sql(l.notes)}, ${sql(l.offer)}, ${sql(l.status)}, ${sql(l.createdAt)}
    );`);
  }

  for (const pu of data.purchases) {
    q(`insert into stock_purchases (id, seller_name, seller_email, amount, status, notes, lead_id, created_at, paid_at) values (
      ${sql(pu.id)}, ${sql(pu.sellerName)}, ${sql(pu.sellerEmail)}, ${sql(pu.amount)}, ${sql(pu.status)}, ${sql(pu.notes)}, ${sql(pu.leadId)}, ${sql(pu.createdAt)}, ${sql(pu.paidAt)}
    );`);
    pu.items.forEach((i) => {
      q(`insert into stock_purchase_items (purchase_id, sku, name, brand, cost) values (
        ${sql(pu.id)}, ${sql(i.sku)}, ${sql(i.name)}, ${sql(i.brand)}, ${sql(i.cost)}
      );`);
    });
  }

  for (const s of data.subscribers) {
    q(`insert into newsletter_subscribers (email, source, consented_at) values (${sql(s.email)}, ${sql(s.source)}, ${sql(s.consentedAt)});`);
  }

  for (const po of data.posts) {
    q(`insert into journal_posts (id, slug, title, excerpt, body, cover_image, published, published_at) values (
      ${sql(po.id)}, ${sql(po.slug)}, ${sql(po.title)}, ${sql(po.excerpt)}, ${arr(po.body)}, ${sql(po.coverImage)}, ${sql(Boolean(po.published))}, ${sql(po.publishedAt)}
    );`);
  }

  for (const e of data.emailLog) {
    q(`insert into email_log (id, recipient, subject, template, status, provider, sent_at, preview) values (
      ${sql(e.id)}, ${sql(e.to)}, ${sql(e.subject)}, ${sql(e.template)}, ${sql(e.status)}, ${sql(e.provider)}, ${sql(e.sentAt)}, ${sql(e.preview)}
    );`);
  }

  for (const a of data.auditLog) {
    q(`insert into audit_logs (actor, action, detail, before, after, at) values (
      ${sql(a.actor)}, ${sql(a.action)}, ${sql(a.detail)}, ${sql(a.before)}, ${sql(a.after)}, ${sql(a.at)}
    );`);
  }

  const counts = await db.query(`
    select
      (select count(*) from products) as products,
      (select count(*) from orders) as orders,
      (select count(*) from discounts) as discounts,
      (select count(*) from journal_posts) as posts,
      (select count(*) from purchase_leads) as leads,
      (select count(*) from stock_purchases) as purchases,
      (select count(*) from newsletter_subscribers) as subscribers,
      (select count(*) from inventory_items) as inventory,
      (select count(*) from audit_logs) as audit
  `);

  const rows = await db.query(
    "select sku, status from inventory_items order by sku limit 5"
  );
  console.log("SEEDED:", counts.rows[0]);
  console.log("SAMPLE:", rows.rows);
  await db.close();

  const header = `-- Vicarious Clothing seed data (generated from the demo store)\n-- Run after schema.sql in the Supabase SQL editor.\n\n`;
  fs.writeFileSync(
    new URL("./seed.sql", import.meta.url),
    header + emitted.join("\n") + "\n"
  );
  console.log("SEED VALID — supabase/seed.sql written (" + emitted.length + " statements)");
}

run().catch((err) => {
  console.error("SEED FAILED:", err.message);
  process.exit(1);
});
