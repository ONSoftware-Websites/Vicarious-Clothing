import Stripe from "stripe";

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}
