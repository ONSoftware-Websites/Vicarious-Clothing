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

// A body-supplied UUID is not ownership evidence: it must match the
// HttpOnly cookie minted for this browser. Never accept another browser's token.
export async function readCheckoutHoldToken(candidate?: unknown) {
  const store = await cookies();
  const cookieToken = normaliseCheckoutHoldToken(store.get(CHECKOUT_HOLD_COOKIE)?.value);
  const supplied = normaliseCheckoutHoldToken(candidate);
  if (supplied && supplied !== cookieToken) return "";
  return cookieToken;
}

export async function getOrCreateCheckoutHoldToken(candidate?: unknown) {
  const store = await cookies();
  const supplied = normaliseCheckoutHoldToken(candidate);
  const cookieToken = normaliseCheckoutHoldToken(store.get(CHECKOUT_HOLD_COOKIE)?.value);
  if (supplied && cookieToken && supplied !== cookieToken)
    throw new Error("Checkout session does not match this browser");
  if (cookieToken) return cookieToken;
  // Delayed/missing cookies must never authorise an attacker-supplied token.
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
