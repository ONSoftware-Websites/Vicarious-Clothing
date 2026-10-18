-- Only a payment-confirmed order belongs in customer order history.
alter table public.orders add column if not exists payment_confirmed_at timestamptz;
create or replace function public.record_order_payment_confirmation()
returns trigger language plpgsql set search_path = ''
as $$
begin
 if new.status::text='PAID' and new.payment_confirmed_at is null then
   new.payment_confirmed_at=now();
 end if;
 return new;
end $$;
drop trigger if exists order_payment_confirmation on public.orders;
create trigger order_payment_confirmation before insert or update on public.orders
for each row execute function public.record_order_payment_confirmation();
update public.orders set payment_confirmed_at=coalesce(payment_confirmed_at,updated_at)
 where payment_confirmed_at is null and status::text in ('PAID','PICKING','PACKED','DISPATCHED','DELIVERED','REFUNDED','PARTIALLY_REFUNDED');
update public.orders o set payment_confirmed_at=coalesce(o.payment_confirmed_at,a.at)
 from public.audit_logs a where o.status::text='CANCELLED'
 and a.action='payment captured' and a.detail=o.id and o.payment_confirmed_at is null;