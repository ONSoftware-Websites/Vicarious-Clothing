import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.ORDER_ACCESS_SECRET || process.env.LEAD_OFFER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("ORDER_ACCESS_SECRET, LEAD_OFFER_SECRET or SUPABASE_SERVICE_ROLE_KEY is required");
  }
  return value;
}

export function createOrderAccessToken(id: string, email: string) {
  return createHmac("sha256", secret())
    .update(`${id}|${email.trim().toLowerCase()}`)
    .digest("hex");
}

export function verifyOrderAccessToken(id: string, email: string, token: string) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = createOrderAccessToken(id, email);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
