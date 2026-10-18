create or replace function public.discard_unpaid_checkout(p_order_id text,p_hold_token text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_expected integer;v_actual integer;
begin
  perform 1 from public.orders where id=upper(p_order_id)
    and status='PENDING_PAYMENT' and payment_confirmed_at is null for update;
  if not found then return false; end if;
  if p_hold_token is null or length(p_hold_token)<10 then return false; end if;
  select count(distinct sku) into v_expected from public.order_items
    where order_id=upper(p_order_id);
  if v_expected=0 then return false; end if;
  select count(*) into v_actual from public.inventory_items ii
    where ii.checkout_hold_order_id=upper(p_order_id)
      and ii.checkout_hold_token=p_hold_token and ii.status='RESERVED'
      and ii.sku in (select sku from public.order_items where order_id=upper(p_order_id));
  if v_actual<>v_expected then return false; end if;
  update public.inventory_items ii set status='AVAILABLE',reserved_until=null,
    checkout_hold_token=null,checkout_hold_order_id=null,
    checkout_hold_started_at=null,updated_at=now()
    where ii.checkout_hold_order_id=upper(p_order_id)
      and ii.checkout_hold_token=p_hold_token and ii.status='RESERVED'
      and ii.sku in (select sku from public.order_items where order_id=upper(p_order_id));
  get diagnostics v_actual=row_count;
  if v_actual<>v_expected then raise exception 'Reservation changed during cancellation'; end if;
  delete from public.orders where id=upper(p_order_id)
    and status='PENDING_PAYMENT' and payment_confirmed_at is null;
  return found;
end $$;
revoke all on function public.discard_unpaid_checkout(text,text) from public,anon,authenticated;
grant execute on function public.discard_unpaid_checkout(text,text) to service_role;