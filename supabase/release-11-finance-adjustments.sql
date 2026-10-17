create table if not exists public.finance_adjustments (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('fee','refund','shipping_cost','packaging','operating_expense','correction')),
 amount numeric(12,2) not null check (amount>0 and amount<=1000000),
 order_id text references public.orders(id) on delete restrict,
 reference text not null,
 description text not null default '',
 occurred_at date not null,
 actor_id uuid,
 created_at timestamptz not null default now(),
 constraint finance_adjustments_reference_length check (length(trim(reference)) between 3 and 140),
 constraint finance_adjustments_description_length check (char_length(description)<=1000),
 constraint finance_adjustments_refund_order check (kind <> 'refund' or order_id is not null)
);
create unique index if not exists finance_adjustments_kind_reference_uniq
 on public.finance_adjustments(kind,reference);
create index if not exists finance_adjustments_order_date_idx
 on public.finance_adjustments(order_id,occurred_at desc);
create index if not exists finance_adjustments_date_idx
 on public.finance_adjustments(occurred_at desc);
alter table public.finance_adjustments enable row level security;
revoke all on public.finance_adjustments from public,anon,authenticated;
grant select,insert on public.finance_adjustments to service_role;
