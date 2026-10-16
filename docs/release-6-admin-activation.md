# Release 6 — admin security activation

## Code completed
- Supabase Auth MFA (TOTP) login is staged behind `ADMIN_AUTH_V2=true`.
- An authenticated account must already have an active `admin_staff` membership and confirmed email before the admin MFA onboarding flow proceeds.
- Every privileged request using V2 checks the current account's MFA assurance (`aal2`) and current active role assignment.
- Legacy shared-password login returns 410 when V2 is enabled. Legacy signed cookies no longer authorize administration in V2.
- Explicit role checks protect major admin pages including orders, discounts, purchases, analytics, emails, inventory, leads, operations, and newsletter.
- Admin navigation hides links that exceed the user's assigned permission level.
- The legacy cookie signature is also cleared on logout.

## Activation blocker
The production Vicarious Supabase project has **zero active admin_staff memberships**. Never enable V2 until the actual owner account is positively identified, verified and provisioned.

## Owner activation procedure
1. Have Henry sign up / confirm his email for a dedicated Supabase Auth account in this specific Vicarious project.
2. Independently verify his exact Auth user UUID in the Supabase Auth dashboard.
3. Insert `(user_id, role='OWNER', active=true)` into `public.admin_staff`. Do not guess the user ID.
4. Enable `ADMIN_AUTH_V2=true` in Vercel Preview; enrol an authenticator and complete `aal2` verification.
5. Test access to all privileged pages and API endpoints, logout, forced sign-out, and inactive-account denial.
6. Activate V2 in production and redeploy only after successful acceptance. Remove or rotate `ADMIN_PASSWORD` afterwards.
7. Test a non-admin Supabase user, a low-privileged staff user, a revoked staff user, and a logged-out browser.

## Remaining security tasks
- Complete exhaustive permission matrix for remaining admin routes, nested pages, and destructive actions.
- Add owner-controlled invitations, staff account disable UI, MFA recovery procedure, login abuse alerts, and session revocation workflows.
- Test build, Next.js route resolution, cookie persistence, and production redirects.
- Until acceptance, `ADMIN_AUTH_V2` must remain false.
