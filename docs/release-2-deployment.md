# Release 2 — rollout and verification

## Implemented in repository
- SellerHQ transactional-style outbox table (`sellerhq_retry_jobs`) and authenticated manual retry endpoint.
- Automatic retries every five minutes through Vercel Cron at `/api/cron/sellerhq`, secured by `CRON_SECRET`.
- Backoff for failed deliveries, one-writer job claiming and stale-worker recovery.
- Checkout payment-intent idempotency by order ID and recovery of an existing pending payment attached to the same checkout hold.
- Validated admin order transitions and prevention of catalogue sync reopening sold or reserved items.
- Unsupported archive/delete integration actions return an error rather than silently upserting.

## Database
Migration `supabase/repair-2026-10-16-release-2.sql` was applied to the Vicarious Supabase project. The outbox table was confirmed present in a subsequent SQL query.

## Required deployment configuration
- Set a random `CRON_SECRET` in Vercel and redeploy.
- Keep `MAINTENANCE_MODE` enabled until acceptance tests complete.
- Ensure SellerHQ's `record_sale` handler deduplicates repeated order events. Sender retries are at-least-once delivery, not exactly-once.
- Verify the Vercel plan supports the five-minute cron frequency.

## Acceptance tests still required
1. Run `npm run build` and `npm test` in the repository environment.
2. Simulate SellerHQ outage during staging payment and confirm queued event subsequently delivers exactly once.
3. Retry the same checkout request and confirm order/payment-intent reuse.
4. Test concurrent paid-order events and ensure receiver rejects duplicates.
5. Confirm accepted and rejected order transitions; test cancellation/refund edge cases.
6. Confirm maintenance redirects the shop while protected cron and Stripe webhooks remain available.
7. Reconcile any existing paid orders not recorded in SellerHQ.
8. Validate the consumer storefront and existing-account checkout end-to-end before disabling maintenance.

**Scope limitation:** This is code-and-schema implementation, not a claim of successful production smoke tests. Automatic retries depend on deploy and CRON_SECRET.
