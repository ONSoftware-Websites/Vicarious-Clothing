-- Release 2: durable SellerHQ retry queue. Apply before deploying retry worker.
create table if not exists public.sellerhq_retry_jobs (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  payload jsonb not null,
  attempts integer not null default 0,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  retry_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sellerhq_retry_jobs enable row level security;
revoke all on public.sellerhq_retry_jobs from public, anon, authenticated;
grant select,insert,update on public.sellerhq_retry_jobs to service_role;
create index if not exists sellerhq_retry_due_idx on public.sellerhq_retry_jobs (retry_after) where status in ('pending','failed');
