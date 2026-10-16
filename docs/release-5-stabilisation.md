# Release 5 — Stabilisation status (16 October 2026)

## Committed changes
- Checkout hold RPC now fails closed instead of falling back to legacy stock reservation on RPC errors.
- Checkout order attachment verifies all requested SKUs were attached before continuing.
- Stripe payment-intent webhook validates GBP currency, amount and expected payment intent ID.
- Boundary tests for the 45-minute checkout window.

## Verified against the connected Vicarious Supabase project
- claim_checkout_hold RPC exists
- attach_checkout_hold_to_order RPC exists
- sellerhq_retry_jobs exists

## User-confirmed
- Maintenance proxy works.
- Existing automated tests pass.

## Schedule retained
- One Vercel Cron at 03:00 UTC daily (SellerHQ retries).
- This was NOT increased. Failed sync jobs may remain queued until the following day.

## Remaining production acceptance — not claimed as passed
- Stripe test-mode payment, refund, expiry and duplicate event simulation.
- Concurrent checkout for the same one-of-one inventory SKU.
- SellerHQ receiver duplicate-event idempotency and outage/recovery scenario.
- Vercel production deployment health and cron secret / run history.
- Reconciliation of Stripe payments versus orders and SellerHQ sale records.
- Confirm CI tests still pass **after** these changes.

Do not disable maintenance or infer passing payment-integrations from unit tests alone.
