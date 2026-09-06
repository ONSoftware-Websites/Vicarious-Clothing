import { cookies } from "next/headers";

export const CHECKOUT_HOLD_COOKIE = "vc_checkout_hold";

export function normaliseCheckoutHoldToken(value: unknown) {
  const token = String(value ?? "").trim();
  return /^[a-f0-9-]{36}$/i.test(token) ? token : "";
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export async function readCheckoutHoldToken(candidate?: unknown) {
  const supplied = normaliseCheckoutHoldToken(candidate);
  if (supplied) return supplied;

  const store = await cookies();
  const token = store.get(CHECKOUT_HOLD_COOKIE)?.value;
  return normaliseCheckoutHoldToken(token);
}

export async function getOrCreateCheckoutHoldToken(candidate?: unknown) {
  const store = await cookies();
  const supplied = normaliseCheckoutHoldToken(candidate);
  if (supplied) {
    store.set(CHECKOUT_HOLD_COOKIE, supplied, cookieOptions());
    return supplied;
  }

  const existing = store.get(CHECKOUT_HOLD_COOKIE)?.value;
  const validExisting = normaliseCheckoutHoldToken(existing);
  if (validExisting) return validExisting;

  const token = crypto.randomUUID();
  store.set(CHECKOUT_HOLD_COOKIE, token, cookieOptions());
  return token;
}

export async function refreshCheckoutHoldToken(token: string) {
  const clean = normaliseCheckoutHoldToken(token);
  if (!clean) return;
  const store = await cookies();
  store.set(CHECKOUT_HOLD_COOKIE, clean, cookieOptions());
}

export async function clearCheckoutHoldToken() {
  const store = await cookies();
  store.set(CHECKOUT_HOLD_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
