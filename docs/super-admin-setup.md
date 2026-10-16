# Vicarious Clothing — Developer super administrator

Role `SUPER_ADMIN` has hierarchy level 5, above `OWNER` (4).
This role inherits all current website administrator permissions, including actions restricted to OWNER.
It still requires an active `admin_staff` membership, verified Supabase Auth login, and MFA assurance AAL2 when `ADMIN_AUTH_V2=true`.

## Grant only after verifying developer identity

In Supabase Dashboard → Authentication → Users, find the developer's own account and verify its user UUID.
Use SQL Editor, substituting the verified UUID:

```sql
insert into public.admin_staff (user_id, role, active)
values ('VERIFIED_DEVELOPER_USER_UUID', 'SUPER_ADMIN', true)
on conflict (user_id) do update
set role = excluded.role, active = excluded.active;
```

Do not modify Henry's OWNER membership. Never guess user IDs, assign based solely on an unverified email or disclose service role credentials.
Verify the result with:

```sql
select user_id, role, active from public.admin_staff
where user_id = 'VERIFIED_DEVELOPER_USER_UUID';
```

The developer should enrol and verify their own MFA factor before production activation.
Super-admin is an application RBAC permission; it does not bypass Supabase RLS or provide direct database admin credentials.

## Changes
- `src/lib/types.ts`: ROLES includes SUPER_ADMIN.
- `src/lib/server/admin-auth.ts`: RBAC level 5.
- `src/app/admin/(protected)/layout.tsx`: navigation permission hierarchy includes level 5.
- `supabase/repair-2026-10-16-super-admin.sql`: verified applied constraint migration.
