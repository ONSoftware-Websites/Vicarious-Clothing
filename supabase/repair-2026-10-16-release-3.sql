create table if not exists public.admin_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('STAFF','MANAGER','ADMIN','OWNER')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.admin_staff enable row level security;
revoke all on public.admin_staff from public, anon, authenticated;
grant select,insert,update,delete on public.admin_staff to service_role;
create index if not exists admin_staff_active_idx on public.admin_staff(active);
-- Provision OWNER only after checking the intended existing Supabase Auth user ID.
