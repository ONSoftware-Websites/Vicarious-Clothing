-- Stage 1 first-party traffic analytics.
-- Raw visitor IPs are never written to analytics_events; they are used only for
-- matching the administrator-managed exclusion list during ingestion.
create table if not exists public.analytics_excluded_ips (
  ip_address inet primary key,
  label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null default 'page_view' check (event_type = 'page_view'),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  referrer_host text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_path_created_at_idx
  on public.analytics_events (path, created_at desc);
create index if not exists analytics_events_session_created_at_idx
  on public.analytics_events (session_id, created_at desc);
create index if not exists analytics_events_visitor_created_at_idx
  on public.analytics_events (visitor_id, created_at desc);

alter table public.analytics_excluded_ips enable row level security;
alter table public.analytics_events enable row level security;
revoke all on public.analytics_excluded_ips from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;
grant all on public.analytics_excluded_ips to service_role;
grant all on public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;
