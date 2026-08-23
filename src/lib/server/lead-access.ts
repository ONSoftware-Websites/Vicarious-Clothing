import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.LEAD_OFFER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(
      "LEAD_OFFER_SECRET or SUPABASE_SERVICE_ROLE_KEY is required for customer lead links"
    );
  }
  return value;
}

function payload(id: string, email: string, expiresAt?: string) {
  return `${id}|${email.trim().toLowerCase()}|${expiresAt ?? ""}`;
}

export function createLeadAccessToken(id: string, email: string, expiresAt?: string) {
  return createHmac("sha256", secret()).update(payload(id, email, expiresAt)).digest("hex");
}

export function verifyLeadAccessToken(
  id: string,
  email: string,
  token: string,
  expiresAt?: string
) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  if (expiresAt) {
    const expiry = Number(expiresAt);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  }
  const expected = createLeadAccessToken(id, email, expiresAt);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
