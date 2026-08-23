import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.LEAD_OFFER_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(
      "NEWSLETTER_UNSUBSCRIBE_SECRET, LEAD_OFFER_SECRET or SUPABASE_SERVICE_ROLE_KEY is required"
    );
  }
  return value;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createNewsletterUnsubscribeToken(email: string) {
  return createHmac("sha256", secret())
    .update(normalizeEmail(email))
    .digest("hex");
}

export function verifyNewsletterUnsubscribeToken(email: string, token: string) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = createNewsletterUnsubscribeToken(email);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
