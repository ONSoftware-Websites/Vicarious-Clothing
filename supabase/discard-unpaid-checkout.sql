-- Abandoned unpaid checkouts are temporary attempts, not customer orders.
-- Only trusted backend can delete them, after Stripe cancellation is confirmed.
create or replace function public.discard_unpaid_checkout(p_order_id text,p_hold_token text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  perform 1 from public.orders where id=upper(p_order_id)
    and status='PENDING_PAYMENT' for update;
  if not found then return false; end if;
  if p_hold_token is null or length(p_hold_token)<10 then return false; end if;
  if not exists (select 1 from public.inventory_items
       where checkout_hold_order_id=upper(p_order_id)
         and checkout_hold_token=p_hold_token and status='RESERVED')
    then return false; end if;
  if exists (select 1 from public.inventory_items
       where checkout_hold_order_id=upper(p_order_id)
         and (checkout_hold_token is distinct from p_hold_token or status<>'RESERVED'))
    then return false; end if;
  update public.inventory_items set status='AVAILABLE',reserved_until=null,
    checkout_hold_token=null,checkout_hold_order_id=null,
    checkout_hold_started_at=null,updated_at=now()
    where checkout_hold_order_id=upper(p_order_id) and checkout_hold_token=p_hold_token
       and status='RESERVED';
  get diagnostics v_count=row_count;
  if v_count=0 then return false; end if;
  delete from public.orders where id=upper(p_order_id) and status='PENDING_PAYMENT';
  return found;
end $$;
revoke all on function public.discard_unpaid_checkout(text,text) from public,anon,authenticated;
grant execute on function public.discard_unpaid_checkout(text,text) to service_role;