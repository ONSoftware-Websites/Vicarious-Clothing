create or replace function public.finalize_paid_order(p_order_id text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_status text; v_provider text; v_intent text; v_expected integer; v_changed integer;
begin
 select status::text,payment_provider::text,payment_intent_id
 into v_status,v_provider,v_intent from public.orders where id=upper(p_order_id) for update;
 if not found or v_status <> 'PENDING_PAYMENT' then return false; end if;
 if v_provider='stripe' and (v_intent is null or v_intent='') then
   raise exception 'Payment intent required';
 end if;
 select count(distinct sku) into v_expected from public.order_items
 where order_id=upper(p_order_id);
 if v_expected=0 then raise exception 'Order has no items'; end if;
 update public.inventory_items ii
 set status='SOLD',sold_at=now(),updated_at=now()
 where ii.sku in (select sku from public.order_items where order_id=upper(p_order_id))
 and ii.status='RESERVED' and ii.checkout_hold_order_id=upper(p_order_id)
 and ii.checkout_hold_token is not null;
 get diagnostics v_changed=row_count;
 if v_changed<>v_expected then raise exception 'Order does not own all reserved stock'; end if;
 update public.orders set status='PAID',updated_at=now() where id=upper(p_order_id)
 and status='PENDING_PAYMENT';
 return true;
end $$;
revoke all on function public.finalize_paid_order(text) from public,anon,authenticated;
grant execute on function public.finalize_paid_order(text) to service_role;