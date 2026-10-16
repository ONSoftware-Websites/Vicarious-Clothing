# Release 7 — Phase 5: Staff permissions and integrations

## Implemented
- Super-admin-only /admin/staff directory lists active/inactive memberships and roles.
- PATCH /api/admin/staff validates role, active flag and user UUID, rechecks Super-admin MFA authority, blocks removing own Super-admin access and guards against disabling the final active Super-admin.
- Owner-or-above /admin/settings surfaces read-only configuration presence and SellerHQ retry job counts. Does not expose secrets, change maintenance state, call Stripe, or run retry processing.
- Both admin pages are integrated into the existing responsive branded navigation with role filtering.

## Security / operational caveats
- Membership changes require verified staff identity and should be audited in a later iteration.
- Staff can only be updated, not invited from this interface. Provision Supabase Auth accounts separately.
- Settings configuration labels indicate environment variable presence, not functional connection tests.
- A super-admin demotion performed by another super-admin may invalidate the target's permission on their next request. Race-proof last-admin enforcement may require a transactional database RPC if multi-super-admin workflows become common.
- Verify server-side access to all nested maintenance and other sensitive pages, not only sidebar visibility.

## Acceptance
Build and lint; test OWNER denied from /admin/staff and PATCH, SUPER_ADMIN updates, own-account lockout protection, final-SUPER_ADMIN protection, inactive account denial, responsive navigation, settings unavailable-database state, no secrets in page source, and accurate retry queue numbers. Maintenance config and Vercel daily cron unchanged.
