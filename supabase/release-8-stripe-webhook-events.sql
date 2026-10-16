create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing' check(status in ('processing','completed')),
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on public.stripe_webhook_events to service_role;
create index if not exists stripe_webhook_events_status_claim_idx on public.stripe_webhook_events(status, claimed_at);