create or replace function public.is_admin()
returns boolean language sql stable
set search_path = ''
as $$
 select exists (
   select 1 from public.profiles
   where id = (select auth.uid()) and role in ('STAFF','MANAGER','ADMIN','OWNER')
 );
$$;