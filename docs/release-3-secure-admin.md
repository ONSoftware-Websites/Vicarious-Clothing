# Release 3 — Secure named administrator accounts

## Implemented
- Database table `public.admin_staff` assigns `STAFF`, `MANAGER`, `ADMIN` or `OWNER` to an existing Supabase Auth user ID.
- RLS enabled; no access for browser roles. Membership is checked server-side via the service-role client.
- When `ADMIN_AUTH_V2=true`, all administrator requests require a valid Supabase Auth user, MFA assurance `aal2`, and active membership.
- Staff sign in with their own email/password, enrol a TOTP authenticator if needed, and verify their code.
- Active membership can be revoked centrally; authorization is checked on each request, so previously issued sessions lose admin access upon deactivation.
- Higher role checks are applied to sensitive order, inventory, refunds, newsletter, leads and maintenance endpoints.
- Legacy password login stops accepting requests when V2 is enabled; the old session cookies are not trusted in V2.

## Mandatory owner onboarding BEFORE activation
1. Identify the owner's actual Supabase Auth account in the Supabase Auth dashboard. Verify the intended user and email ownership.
2. Ensure the account can sign in by password and has a verified email address. Do not create or guess user IDs.
3. Insert its verified Auth UUID into `public.admin_staff` as role `OWNER`, active `true`. Example (replace placeholder):
```sql
insert into public.admin_staff(user_id,role,active)
values ('REPLACE_WITH_VERIFIED_AUTH_UUID','OWNER',true)
on conflict (user_id) do update set role='OWNER',active=true;
```
4. Activate `ADMIN_AUTH_V2=true` in Vercel Preview only. Test login, enrolment, six-digit authenticator verification, role checks and logout. If owner login fails, keep production V2 disabled.
5. Activate V2 in production only after the owner has successfully enrolled MFA in the correct environment and the server-side role lookup works.

## Revocation
`update public.admin_staff set active=false where user_id='VERIFIED_UUID';`
The named user loses privileged requests immediately. For full Supabase Auth logout, revoke that user's sessions in the Auth administration interface too.

## Limitations / pending tests
- The database had zero active administrator memberships at the time of this migration.
- The environment flag is intentionally NOT enabled by the code or this migration.
- Account provisioning, build, MFA flow testing, and live production checks have not been performed.
- A comprehensive endpoint permission matrix and self-service administrator management interface are future hardening tasks.
