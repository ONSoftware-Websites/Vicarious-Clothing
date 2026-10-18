# Permanent storefront maintenance toggle

Implementation branch: `feature/admin-maintenance-toggle`. No merge to `master` or manual production deployment has been performed.

## Behaviour
- Existing full-screen `/maintenance` page is retained unchanged.
- OWNER/SUPER_ADMIN can enable or disable storefront maintenance from Admin → Maintenance.
- Switch is persisted in `public.storefront_controls`, singleton row `id=1`; updated timestamp and actor recorded.
- Live Next.js 16 `proxy.ts` reads the flag with a non-cached service-role request. New public requests are redirected to the maintenance page; public API requests receive 503.
- Admin pages and API, integrations, Stripe webhooks, cron, health checks and required static assets remain accessible.
- If the database configuration cannot be read, production falls back to maintenance enabled rather than accidentally exposing the storefront.
- Disabled maintenance allows the storefront to operate normally. Legacy environment-variable maintenance gate is neutralised.
- Toggle API is OWNER-role protected with existing administrative authentication/MFA and creates an audit log.
- Maintenance setting is deliberately initialised to **ON** for safe rollout. The switch can be turned off by an authorised Owner after deployment. No production toggle has been flipped via chat.

## Live database
`supabase/maintenance-toggle.sql` successfully applied. Verified singleton `maintenance_enabled=true`; anon SELECT denied, authenticated UPDATE denied, service-role SELECT granted; RLS enabled.

## Production acceptance (not verified)
- Run `npm run lint`, `npm test`, `npm run build`.
- Check Owner can see and change toggle; Manager/Staff cannot.
- Toggle on: public pages redirect to maintenance, non-exempt APIs return 503, payment/cron/webhook callbacks stay reachable and assets display.
- Toggle off: storefront pages and checkout APIs become available to new requests without rebuilding.
- Check database outage fails closed in production, errors visible on admin control.
- Check admin audit history for toggle events.
- Confirm production proxy routing behaviour and `src/middleware.ts` compatibility with Next.js 16.

## Limitations
- This is a website traffic gate, not a complete suspension of third-party background integrations.
- Long-running/in-flight requests are not retroactively cancelled.
- If the backend database is unavailable, controls may be inaccessible until connectivity is restored.
- No scheduled cron or external payment changes were made.
