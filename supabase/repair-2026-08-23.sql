-- Vicarious Clothing reliability repair — 2026-08-23
-- Run once in the Supabase SQL editor before deploying the matching application changes.

-- Atomically claim one-of-one inventory for checkout. Expired reservations are
-- released first, then only AVAILABLE rows can be claimed by this transaction.
create or replace function public.claim_inventory(p_skus text[], p_minutes integer default 30)
returns table(sku text)
language plpgsql
security definer
set search_path = public
as $$
begin
  update inventory_items
  set status = 'AVAILABLE', reserved_until = null, updated_at = now()
  where status = 'RESERVED'
    and reserved_until is not null
    and reserved_until < now();

  return query
  update inventory_items
  set status = 'RESERVED',
      reserved_until = now() + make_interval(mins => greatest(1, p_minutes)),
      updated_at = now()
  where inventory_items.sku = any(p_skus)
    and inventory_items.status = 'AVAILABLE'
  returning inventory_items.sku;
end;
$$;

revoke all on function public.claim_inventory(text[], integer) from public;
grant execute on function public.claim_inventory(text[], integer) to service_role;

-- The legacy createOrder implementation records a discount before Stripe has
-- actually succeeded. These two RPCs let the repaired checkout undo that pending
-- use and later finalize it exactly once, even if browser completion and Stripe's
-- webhook arrive at the same time.
create or replace function public.undo_discount_usage(p_code text, p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update discounts
  set used_count = greatest(0, used_count - 1),
      used_emails = array_remove(used_emails, lower(trim(p_email)))
  where lower(code) = lower(trim(p_code))
    and lower(trim(p_email)) = any(used_emails);
$$;

create or replace function public.record_discount_usage_once(p_code text, p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update discounts
  set used_count = used_count + 1,
      used_emails = array_append(used_emails, lower(trim(p_email)))
  where lower(code) = lower(trim(p_code))
    and not (lower(trim(p_email)) = any(used_emails));
$$;

revoke all on function public.undo_discount_usage(text, text) from public;
revoke all on function public.record_discount_usage_once(text, text) from public;
grant execute on function public.undo_discount_usage(text, text) to service_role;
grant execute on function public.record_discount_usage_once(text, text) to service_role;

-- Storage used by the Sell To Us form. Uploads are performed server-side with
-- the service-role key; public read is required so staff can view submitted photos.
insert into storage.buckets (id, name, public)
values ('lead-photos', 'lead-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "lead photos public read" on storage.objects;
create policy "lead photos public read"
on storage.objects for select
using (bucket_id = 'lead-photos');
