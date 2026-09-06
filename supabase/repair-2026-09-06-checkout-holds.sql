-- Vicarious Clothing checkout holds — 2026-09-06
-- Run once in the Supabase SQL editor before relying on the new checkout-hold flow.
-- This replaces timed reservations with customer/browser-session holds.

alter table public.inventory_items
  add column if not exists checkout_hold_token text,
  add column if not exists checkout_hold_order_id text,
  add column if not exists checkout_hold_started_at timestamptz;

create index if not exists inventory_items_checkout_hold_token_idx
  on public.inventory_items (checkout_hold_token)
  where checkout_hold_token is not null;

create index if not exists inventory_items_checkout_hold_order_id_idx
  on public.inventory_items (checkout_hold_order_id)
  where checkout_hold_order_id is not null;

-- Claim one-of-one inventory for a specific browser checkout session.
-- The same session can re-claim its own unconverted hold idempotently; another
-- session cannot take it until the owning session releases it or it is sold.
create or replace function public.claim_checkout_hold(
  p_skus text[],
  p_hold_token text
)
returns table(sku text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_hold_token is null or length(trim(p_hold_token)) < 10 then
    raise exception 'A checkout hold token is required';
  end if;

  return query
  update inventory_items ii
  set status = 'RESERVED',
      reserved_until = null,
      checkout_hold_token = trim(p_hold_token),
      checkout_hold_order_id = null,
      checkout_hold_started_at = coalesce(ii.checkout_hold_started_at, now()),
      updated_at = now()
  where ii.sku = any(p_skus)
    and (
      ii.status = 'AVAILABLE'
      or (
        ii.status = 'RESERVED'
        and ii.checkout_hold_token = trim(p_hold_token)
        and ii.checkout_hold_order_id is null
      )
    )
  returning ii.sku;
end;
$$;

-- Once an order is created, tie the existing browser hold to that order.
create or replace function public.attach_checkout_hold_to_order(
  p_skus text[],
  p_hold_token text,
  p_order_id text
)
returns table(sku text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_hold_token is null or length(trim(p_hold_token)) < 10 then
    raise exception 'A checkout hold token is required';
  end if;

  if p_order_id is null or length(trim(p_order_id)) < 2 then
    raise exception 'An order id is required';
  end if;

  return query
  update inventory_items ii
  set checkout_hold_order_id = upper(trim(p_order_id)),
      reserved_until = null,
      updated_at = now()
  where ii.sku = any(p_skus)
    and ii.status = 'RESERVED'
    and ii.checkout_hold_token = trim(p_hold_token)
    and ii.checkout_hold_order_id is null
  returning ii.sku;
end;
$$;

-- Release a checkout hold. Customer/browser cancellation passes both the hold
-- token and order id; trusted server-side Stripe flows can release by order id.
create or replace function public.release_checkout_hold(
  p_skus text[],
  p_hold_token text default null,
  p_order_id text default null
)
returns table(sku text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (p_hold_token is null or length(trim(p_hold_token)) < 10)
     and (p_order_id is null or length(trim(p_order_id)) < 2) then
    return;
  end if;

  return query
  update inventory_items ii
  set status = 'AVAILABLE',
      reserved_until = null,
      checkout_hold_token = null,
      checkout_hold_order_id = null,
      checkout_hold_started_at = null,
      updated_at = now()
  where ii.sku = any(p_skus)
    and ii.status = 'RESERVED'
    and (
      (
        p_order_id is not null
        and ii.checkout_hold_order_id = upper(trim(p_order_id))
        and (p_hold_token is null or ii.checkout_hold_token = trim(p_hold_token))
      )
      or (
        p_order_id is null
        and p_hold_token is not null
        and ii.checkout_hold_token = trim(p_hold_token)
        and ii.checkout_hold_order_id is null
      )
    )
  returning ii.sku;
end;
$$;

revoke all on function public.claim_checkout_hold(text[], text) from public;
revoke all on function public.attach_checkout_hold_to_order(text[], text, text) from public;
revoke all on function public.release_checkout_hold(text[], text, text) from public;

grant execute on function public.claim_checkout_hold(text[], text) to service_role;
grant execute on function public.attach_checkout_hold_to_order(text[], text, text) to service_role;
grant execute on function public.release_checkout_hold(text[], text, text) to service_role;
