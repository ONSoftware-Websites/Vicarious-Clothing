-- Vicarious Clothing — admin delete integrity repairs
-- Run this after supabase/schema.sql, repair-2026-08-23.sql and repair-2026-08-24.sql.

-- Product deletion should not delete historical order lines. Keep the order item
-- snapshot, but detach the nullable SKU reference when a product is removed.
alter table if exists public.order_items
  drop constraint if exists order_items_sku_fkey;

alter table if exists public.order_items
  add constraint order_items_sku_fkey
  foreign key (sku)
  references public.products (sku)
  on delete set null;

-- Lead deletion should keep stock purchase records but remove the live lead link.
alter table if exists public.stock_purchases
  drop constraint if exists stock_purchases_lead_id_fkey;

alter table if exists public.stock_purchases
  add constraint stock_purchases_lead_id_fkey
  foreign key (lead_id)
  references public.purchase_leads (id)
  on delete set null;

-- Defensive indexes for admin delete lookups.
create index if not exists order_items_sku_idx on public.order_items (sku);
create index if not exists stock_purchase_items_sku_idx on public.stock_purchase_items (sku);
create index if not exists stock_purchases_lead_id_idx on public.stock_purchases (lead_id);
