import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.LEAD_OFFER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("LEAD_OFFER_SECRET or SUPABASE_SERVICE_ROLE_KEY is required for customer lead links");
  }
  return value;
}

export function createLeadAccessToken(id: string, email: string) {
  return createHmac("sha256", secret())
    .update(`${id}|${email.trim().toLowerCase()}`)
    .digest("hex");
}

export function verifyLeadAccessToken(id: string, email: string, token: string) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = createLeadAccessToken(id, email);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
