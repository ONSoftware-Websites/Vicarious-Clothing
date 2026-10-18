create table if not exists public.storefront_controls (
 id integer primary key check(id=1),
 maintenance_enabled boolean not null default true,
 updated_at timestamptz not null default now(),
 updated_by uuid
);
insert into public.storefront_controls(id,maintenance_enabled)
values(1,true) on conflict(id) do nothing;
alter table public.storefront_controls enable row level security;
revoke all on public.storefront_controls from public,anon,authenticated;
grant select,update on public.storefront_controls to service_role;