import { cookies } from "next/headers";

export const CHECKOUT_HOLD_COOKIE = "vc_checkout_hold";

function validToken(value: string | undefined) {
  return Boolean(value && /^[a-f0-9-]{36}$/i.test(value));
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

export async function readCheckoutHoldToken() {
  const store = await cookies();
  const token = store.get(CHECKOUT_HOLD_COOKIE)?.value;
  return validToken(token) ? token! : "";
}

export async function getOrCreateCheckoutHoldToken() {
  const store = await cookies();
  const existing = store.get(CHECKOUT_HOLD_COOKIE)?.value;
  if (validToken(existing)) return existing!;

  const token = crypto.randomUUID();
  store.set(CHECKOUT_HOLD_COOKIE, token, cookieOptions());
  return token;
}

export async function refreshCheckoutHoldToken(token: string) {
  if (!validToken(token)) return;
  const store = await cookies();
  store.set(CHECKOUT_HOLD_COOKIE, token, cookieOptions());
}

export async function clearCheckoutHoldToken() {
  const store = await cookies();
  store.set(CHECKOUT_HOLD_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
