-- Expand existing admin membership roles without changing current memberships.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.admin_staff'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.admin_staff drop constraint %I', constraint_name);
  end loop;
end $$;
alter table public.admin_staff
  add constraint admin_staff_role_check
  check (role in ('STAFF','MANAGER','ADMIN','OWNER','SUPER_ADMIN'));
