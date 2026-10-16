# Release 8 — Database & transaction hardening

Implementation date: 2026-10-16. Status: code and database migrations implemented; production deployment/build and full end-to-end tests not independently verified.

## 1. Privileged database RPC access
Applied migration `supabase/release-8-privileges-purchases.sql`:
- Revoked `EXECUTE` from PUBLIC, anon and authenticated on existing public SECURITY DEFINER functions.
- Retained server-side service_role execution.
- Added `stock_purchases_one_per_lead` unique index to prevent duplicate purchases from one seller submission.
- Fixed `public.is_admin` schema qualification in separate migration `supabase/release-8-is-admin-schema.sql`; legacy profile role enum is intentionally not changed.
- Security advisor no longer reports the previous anonymous/authenticated SECURITY DEFINER execution warnings.

## 2. Stripe, checkout and stock
- Shared `paymentIntentMatchesOrder` checks successful status, intended order ID, GBP currency, amount in pence and existing PaymentIntent association.
- Browser checkout completion, payment_intent.succeeded webhook, and hosted Checkout session webhook call the same helper.
- Hosted Checkout requires confirmed paid status and matching successful PaymentIntent.
- `src/app/api/checkout/route.ts` tracks provisional order ID and attempts to cancel and release holds if provisioning fails.
- Database migration `supabase/release-8-atomic-payment.sql` adds service-role-only `finalize_paid_order`, which marks a pending order paid and its held inventory sold in a single database transaction, refusing absent/inconsistent stock.
- `src/lib/server/supabase-store.ts` now uses the new function and avoids regressing non-pending statuses.
- Checkout completion returns a conflict rather than reporting paid if the paid state cannot be confirmed; Stripe webhook retries on incomplete transitions.
- Database migration `supabase/release-8-stripe-webhook-events.sql` creates a private webhook event processing ledger; duplicated/concurrent events are claimed by ID with a lease.
- `src/lib/server/stripe-payment-validation.test.ts` contains regression tests (tests not executed in this session).

## 3. Seller acquisition concurrency
- `stock_purchases_one_per_lead` enforces at most one linked purchase per lead.
- `src/lib/server/lead-transitions.ts` performs compare-and-set status updates.
- Both customer decision and admin lead endpoints use the transition helper and recover from a concurrently created purchase.
- Admin offer expiry is recorded before sending the actionable offer email.

## 4. Wishlist consistency
Applied migration `supabase/release-8-wishlist-atomic.sql`:
- Merged duplicate wishlist rows while preserving item membership and removed duplicates.
- Created a unique index enforcing one wishlist per customer.
- Added `sync_current_wishlist`: authenticated, SECURITY INVOKER, restricted EXECUTE, advisory transaction lock and atomic add/removal.
- Hook now calls the RPC and does not discard local items after a failed login merge.

## 5. Checkout expiry
- Existing `claim_checkout_hold` itself invokes `expire_checkout_holds` on reservation attempts.
- Existing scheduled cron `/api/cron/sellerhq` additionally invokes expiry cleanup as a safety net, while preserving the original once-daily `0 3 * * *` schedule. Cron secret is still required.
- Late-payment refund and time-window rules are retained.

## Verification actually performed
- All SQL migrations above returned success from the live Supabase project.
- Privileged function execution is denied for anon/authenticated and allowed for service_role.
- Atomic payment RPC tested against a nonexistent order; correctly returned false without modification.
- No duplicate lead purchases or duplicate wishlist records remain.
- Webhook ledger and both atomic functions exist.
- Supabase security advisor after migration reports only informational no-policy notices for intentionally restricted tables, plus leaked-password protection not enabled.
- `vercel.json` daily cron unchanged.

## Cannot claim without further evidence
- Vercel reports build-rate-limit failure, not a successful build. No build, lint, Vitest or production browser end-to-end verification was run in this session.
- Supabase leaked-password protection must be enabled separately in Auth configuration; this connector does not expose that switch.
- Validate concurrent payments, failed inventory attachment, simultaneous seller decisions, wishlist merge and MFA session boundaries after the deployment limit is cleared.
- Confirm the new `sync_current_wishlist` RPC operates with the live authenticated user's RLS policies.
- Reconciliation of historic payments and email/SellerHQ side effects is not performed by these migrations; handle separately if historical inconsistencies exist.

## Rollout
Use the current commit after Vercel build capacity returns; do not modify cron frequency, Stripe keys or maintenance flag as part of Release 8. Keep maintenance as currently configured until explicit opening approval.
