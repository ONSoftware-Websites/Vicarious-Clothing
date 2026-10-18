create table if not exists public.operational_events (
 id bigint generated always as identity primary key,
 subsystem text not null check(subsystem in ('cron','sellerhq','email','health')),
 severity text not null check(severity in ('info','warning','error')),
 event text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists operational_events_recent_idx on public.operational_events(created_at desc);
alter table public.operational_events enable row level security;
revoke all on public.operational_events from public,anon,authenticated;
grant select,insert on public.operational_events to service_role;
