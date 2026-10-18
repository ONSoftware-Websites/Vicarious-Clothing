-- Checkout expiry must not release order-linked stock while Stripe payment is in-flight.
-- Background application reconciliation will cancel safe PaymentIntents and
-- transactionally discard unpaid attempts; settled payments remain for webhook recovery.
create or replace function public.expire_checkout_holds()
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  update public.inventory_items ii
    set status='AVAILABLE',reserved_until=null,checkout_hold_token=null,
        checkout_hold_order_id=null,checkout_hold_started_at=null,updated_at=now()
  where ii.status='RESERVED' and ii.checkout_hold_token is not null
    and ii.checkout_hold_order_id is null
    and ii.checkout_hold_started_at < now()-interval '30 minutes';
  get diagnostics v_count=row_count;
  return v_count;
end $$;
revoke all on function public.expire_checkout_holds() from public,anon,authenticated;
grant execute on function public.expire_checkout_holds() to service_role;