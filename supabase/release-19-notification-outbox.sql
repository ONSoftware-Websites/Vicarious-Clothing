create table if not exists public.order_notification_retries (
 id bigint generated always as identity primary key,
 order_id text not null references public.orders(id) on delete cascade,
 template text not null,
 status text not null default 'pending' check (status in ('pending','processing','failed','done','dead_letter')),
 attempts integer not null default 0,
 retry_after timestamptz not null default now(),
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(order_id,template)
);
create index if not exists order_notification_retries_due_idx on public.order_notification_retries(status,retry_after);
alter table public.order_notification_retries enable row level security;
revoke all on public.order_notification_retries from anon,authenticated;
grant select,insert,update on public.order_notification_retries to service_role;
grant usage,select on sequence public.order_notification_retries_id_seq to service_role;