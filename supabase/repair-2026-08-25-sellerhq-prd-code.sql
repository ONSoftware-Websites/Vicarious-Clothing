-- Vicarious Clothing — SellerHQ PRD code storage
-- Run this after supabase/schema.sql and the existing repair files.

-- Store the SellerHQ inventory PRD code on the private inventory layer, not
-- the public products catalogue. This keeps the code visible in admin inventory
-- only and out of the customer-facing storefront.
alter table public.inventory_items
  add column if not exists sellerhq_prd_code text;

create index if not exists inventory_items_sellerhq_prd_code_idx
  on public.inventory_items (sellerhq_prd_code)
  where sellerhq_prd_code is not null;
