# Release 12 — Operations Monitoring & Automated Recovery

Branch: `feature/release-12-operations-monitoring`. Production `master` not modified during development.

## Implemented

### Operational event telemetry
- New restricted `public.operational_events` ledger for cron, SellerHQ, email and health events.
- Server-only event writer strips payloads and credentials; inserts structured metadata without logging customer PII.
- Database RLS enabled. Public, anonymous and regular authenticated users cannot select/insert.
- Daily cron records start, completion and failures; checkout hold expiry and SellerHQ processing remain in the same once-daily job.
- Transactional email provider rejections/network failures are logged as non-sensitive operational exceptions. Provider acceptance is accurately distinguished from mailbox delivery confirmation.

### SellerHQ retries
- Existing worker now retries no more than 8 times and places terminal failures in `dead_letter`.
- Retry policy has deterministic exponential backoff and unit tests.
- Owner and Super-admin may manually requeue a terminal failure through a confirmed, permission-gated API. It resets retry count and schedules the job; it does not immediately call the remote service.
- Requeue actions write a staff-attributed audit event.
- Admin monitoring page displays exceptions, recent jobs, schedule health and recent system events.

### Operations UI and health checks
- `/admin/monitoring` Owner-only monitoring workspace, linked from settings and the admin sidebar.
- Missing successful daily cron runs and unresolved latest cron errors are visibly flagged.
- Existing `/admin/emails` now accurately labels Resend API acceptance rather than promising recipient delivery.
- `/api/health` detailed checks now require `Authorization: Bearer HEALTHCHECK_SECRET` in production, not a URL query string.
- Removed legacy `claim_inventory` mutation and public lead bucket checks from health diagnostics; replaced with read-only checks for restricted operational, SellerHQ and finance tables and private lead photo storage.
- No extra cron added; `vercel.json` retains daily `0 3 * * *`.

## Database verification
Migration `supabase/release-12-operational-events.sql` applied to linked Supabase.
- RLS true; anonymous read and ordinary authenticated insert disabled; server role read enabled.
- Ledger initially empty (events appear once deployed code runs); there were no dead-letter jobs at verification time.

## Test / production acceptance still needed
- Run `npm run lint`, `npm test`, `npm run build` and test production or preview.
- Test OWNER vs ADMIN permissions on monitoring/requeue.
- Simulate a SellerHQ delivery failure up to eight attempts; verify eventual dead-letter, no accidental automatic retries, and successful manual recovery after external issue resolution.
- Verify cron run events after the next scheduled 03:00 UTC execution and confirm no change in schedule.
- Trigger safe test-mode Resend failures and verify only non-sensitive metadata is recorded; verify normal email sending unaffected.
- Check public and bearer-authorized health responses and browser responsiveness.
- Check alert thresholds and system time zones.
- Monitor Supabase RLS/security advisors again at deploy time.

## Scope limitations
- Monitoring shows reported events, not a guarantee of external SellerHQ acceptance or email inbox delivery.
- Live email bounce/delivery event webhooks are not integrated; provider-specific authentication and event signing would need setup.
- No third-party pager, Slack integration or external alert receiver is configured, so alerts are currently displayed in the admin UI and server event ledger rather than proactively sent elsewhere.
- Old jobs/events before this release cannot be retrospectively reconstructed.
- No payment processing, Stripe refunds, finance calculations, stock purchasing or existing staff role hierarchy changed.

## Deployment
Draft PR; one final merge into master only when requested. Avoid per-commit production deployments.
