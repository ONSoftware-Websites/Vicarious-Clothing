create table if not exists public.workflow_records (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('lead','order')),
 reference_id text not null,
 category text not null check (category in ('note','inspection','intake','packing','return')),
 note text not null default '',
 checklist jsonb not null default '{}'::jsonb,
 actor_id uuid,
 created_at timestamptz not null default now(),
 constraint workflow_records_note_length check (char_length(note)<=4000),
 constraint workflow_records_checklist_object check (jsonb_typeof(checklist)='object')
);
create index if not exists workflow_records_lookup_idx on public.workflow_records(kind,reference_id,created_at desc);
alter table public.workflow_records enable row level security;
revoke all on public.workflow_records from public,anon,authenticated;
grant select,insert on public.workflow_records to service_role;
