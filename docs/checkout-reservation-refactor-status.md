# Reservation and unpaid checkout refactor — deployment gate

## Implemented
- Unpaid checkout cancellation checks browser hold ownership, safely cancels Stripe PaymentIntent when permitted, then calls `discard_unpaid_checkout`.
- `discard_unpaid_checkout` transactionally releases stock and deletes the temporary PENDING_PAYMENT row (dependent order_items cascade). Confirmed orders are protected.
- Failed card attempt event no longer cancels the entire checkout; customers may retry.
- Customer account order history omits PENDING_PAYMENT attempts and CANCELLED orders without evidence of confirmed payment.
- `payment_confirmed_at` is set upon first PAID transition and retained through later cancellation; existing confirmed orders backfilled where determinable.
- SQL automatic expiration only clears unlinked pre-order holds; it no longer releases stock attached to a payment that may be processing.
- Daily cron includes Stripe-aware stale attempt reconciliation; attempts with succeeded/processing payments are left for settlement.
- Explicit Cancel checkout UI no longer silently navigates to bag after a rejected cancellation.

## Unfinished / critical constraints
1. The payment flow **still creates a temporary PENDING_PAYMENT row in `orders`** before payment. A true no-order-until-confirmation implementation requires introducing `checkout_attempts` and creating the final order only in payment settlement; this is not complete.
2. Expired linked attempts are swept by the existing **once-daily** cron (03:00 UTC), not immediately at the 45-minute boundary. Stripe processing/succeeded cases remain unresolved for webhook/manual review.
3. Successful Stripe payment after a hold expires can still require reconciliation/refund. A fully transactional post-payment state machine is not yet implemented.
4. Vercel has reported failed builds. Production acceptance is blocked until build logs are inspected and lint/test/build pass.
5. Concurrent checkout cancellation versus payment webhook race and browser/multiple-tab scenarios need automated integration tests.

## Safe acceptance criteria
- Production build passes and new deployment is ready.
- Competing browsers cannot reserve same SKU.
- Abandon before Stripe attempt: release SKU without customer order.
- Explicit cancel after PaymentIntent created: cancel intent before release, delete temporary row.
- Declined card: checkout stays retryable, hold persists until expiry.
- Stripe processing/succeeded: cancellation cannot release stock; webhook settles or escalates.
- Paid order cancellation: keep order and history.
- Unpaid expiry: remove temporary attempt, do not claim a cancellation order exists.
- Profile shows only confirmed orders and genuine after-payment cancellations.
