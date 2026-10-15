-- Release 1 containment migration (run before deploying application changes).
-- Existing public lead photos remain untouched; new photos use a private bucket.
insert into storage.buckets (id, name, public)
values ('lead-photos-private', 'lead-photos-private', false)
on conflict (id) do update set public = false;

-- Private objects are only read using short-lived signed URLs issued server-side.
drop policy if exists "lead photos private public read" on storage.objects;

-- Reclaim abandoned holds, ensuring pending orders become CANCELLED before release.
create or replace function public.expire_checkout_holds()
returns integer language plpgsql security definer set search_path = public as $$
declare count_released integer;
begin
  update public.orders o set status = 'CANCELLED', updated_at = now()
  where o.status = 'PENDING_PAYMENT'
    and o.created_at < now() - interval '45 minutes'
    and exists (select 1 from public.inventory_items ii
                where ii.checkout_hold_order_id = o.id);

  update public.inventory_items ii
  set status = 'AVAILABLE', reserved_until = null,
      checkout_hold_token = null, checkout_hold_order_id = null,
      checkout_hold_started_at = null, updated_at = now()
  where ii.status = 'RESERVED' and ii.checkout_hold_token is not null
    and (
      (ii.checkout_hold_order_id is null and ii.checkout_hold_started_at < now() - interval '30 minutes')
      or (ii.checkout_hold_order_id is not null and not exists (
        select 1 from public.orders o
        where o.id = ii.checkout_hold_order_id and o.status not in ('CANCELLED')
      ) and ii.checkout_hold_started_at < now() - interval '45 minutes')
    );
  get diagnostics count_released = row_count;
  return count_released;
end $$;

revoke all on function public.expire_checkout_holds() from public;
grant execute on function public.expire_checkout_holds() to service_role;

-- Claim-time reclamation covers traffic without an external scheduler.
create or replace function public.claim_checkout_hold(p_skus text[], p_hold_token text)
returns table(sku text) language plpgsql security definer set search_path = public as $$
begin
  if p_hold_token is null or length(trim(p_hold_token)) < 10 then
    raise exception 'A checkout hold token is required';
  end if;
  perform public.expire_checkout_holds();
  return query update public.inventory_items ii
  set status = 'RESERVED', reserved_until = now() + interval '30 minutes',
      checkout_hold_token = trim(p_hold_token),
      checkout_hold_order_id = null,
      checkout_hold_started_at = case
        when ii.checkout_hold_token = trim(p_hold_token) then ii.checkout_hold_started_at
        else now() end, updated_at = now()
  where ii.sku = any(p_skus)
    and (ii.status = 'AVAILABLE'
      or (ii.status = 'RESERVED' and ii.checkout_hold_token = trim(p_hold_token)
          and ii.checkout_hold_order_id is null
          and ii.checkout_hold_started_at > now() - interval '30 minutes'))
  returning ii.sku;
end $$;
revoke all on function public.claim_checkout_hold(text[], text) from public;
grant execute on function public.claim_checkout_hold(text[], text) to service_role;

-- Recommended: schedule SELECT public.expire_checkout_holds() every minute
-- through Supabase Cron/pg_cron. Without Cron, reclamation happens on subsequent claims.

-- Atomic per-origin request limits for public write endpoints.
create table if not exists public.public_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  hits integer not null default 0
);
alter table public.public_rate_limits enable row level security;
revoke all on public.public_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.public_rate_limits to service_role;

create or replace function public.check_public_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) returns boolean language plpgsql security definer set search_path = public as $$
declare current_hits integer;
begin
  if p_key !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;
  insert into public.public_rate_limits(key, window_started_at, hits)
  values(p_key, now(), 1)
  on conflict (key) do update
    set hits = case
      when public.public_rate_limits.window_started_at <
        now() - make_interval(secs => p_window_seconds) then 1
      else public.public_rate_limits.hits + 1 end,
      window_started_at = case
      when public.public_rate_limits.window_started_at <
        now() - make_interval(secs => p_window_seconds) then now()
      else public.public_rate_limits.window_started_at end
  returning hits into current_hits;
  return current_hits <= p_limit;
end $$;
revoke all on function public.check_public_rate_limit(text, integer, integer) from public;
grant execute on function public.check_public_rate_limit(text, integer, integer) to service_role;
-- Clean stale buckets via scheduled DELETE older than one day.
