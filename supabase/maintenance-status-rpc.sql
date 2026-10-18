create or replace function public.storefront_maintenance_status()
returns boolean
language sql stable security definer
set search_path = ''
as $$
 select coalesce((select maintenance_enabled from public.storefront_controls where id=1),true);
$$;
revoke all on function public.storefront_maintenance_status() from public;
grant execute on function public.storefront_maintenance_status() to anon, authenticated, service_role;