/** Stripe PaymentIntent states that are safe to cancel before releasing unique stock.
 * 'processing'/'succeeded' are intentionally excluded. */
export const CANCELLABLE_UNPAID_INTENT_STATES = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "requires_capture",
] as const;

export function canSafelyCancelCheckoutIntent(status: string): boolean {
  return (CANCELLABLE_UNPAID_INTENT_STATES as readonly string[]).includes(status);
}

export function paymentNeedsSettlement(status: string): boolean {
  return status === "succeeded";
}

export function paymentMustRemainReserved(status: string): boolean {
  return status === "processing" || paymentNeedsSettlement(status);
}
