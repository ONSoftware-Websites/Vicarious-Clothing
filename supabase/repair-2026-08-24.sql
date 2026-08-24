-- Vicarious Clothing — production flow repairs
-- Run this after supabase/schema.sql and supabase/repair-2026-08-23.sql.

-- The application reads/writes tracking on orders. Keep the existing shipments
-- table, but add order-level tracking fields so the admin dispatch flow works
-- against the current store layer.
alter table public.orders
  add column if not exists carrier text,
  add column if not exists tracking text;

-- Lead offer decisions should not rely on email_log to determine expiry.
alter table public.purchase_leads
  add column if not exists offer_sent_at timestamptz,
  add column if not exists offer_expires_at timestamptz;

-- Newsletter unsubscribe metadata for one-click unsubscribe and auditability.
alter table public.newsletter_subscribers
  add column if not exists unsubscribed_at timestamptz;

-- Keep active subscriber lookups fast.
create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (email)
  where unsubscribed_at is null;

-- Product visibility/status is stored in inventory_items, not products.
-- Backfill any catalogue rows that were created without their inventory unit.
insert into public.inventory_items (sku, status, created_at, updated_at)
select
  p.sku,
  case
    when p.listed_at is not null then 'AVAILABLE'::public.inventory_status
    else 'DRAFT'::public.inventory_status
  end,
  now(),
  now()
from public.products p
left join public.inventory_items i on i.sku = p.sku
where i.sku is null;
