import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { adminEnabled } from "@/lib/admin-config";

export const COOKIE = "vc_admin";
export const ROLE_COOKIE = "vc_admin_role";
export const SIG_COOKIE = "vc_admin_sig";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
  secure: process.env.NODE_ENV === "production",
};

export { adminEnabled };

const ROLE_LEVEL: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function signRole(role: Role) {
  const secret = adminSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(`vc_admin|${role}`).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

function parseRole(value: string | undefined): Role {
  return value && ROLE_LEVEL[value as Role] !== undefined ? (value as Role) : "OWNER";
}

export async function isAdminSession() {
  const store = await cookies();
  if (store.get(COOKIE)?.value !== "1") return false;
  const role = parseRole(store.get(ROLE_COOKIE)?.value);
  const signature = store.get(SIG_COOKIE)?.value ?? "";
  const expected = signRole(role);
  return Boolean(expected) && safeEqualHex(signature, expected);
}

export async function getAdminRole(): Promise<Role> {
  if (!(await isAdminSession())) return "CUSTOMER";
  const store = await cookies();
  return parseRole(store.get(ROLE_COOKIE)?.value);
}

export async function requireRole(minRole: Role) {
  const role = await getAdminRole();
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

export async function requireAdminApi() {
  if (!(await isAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function setAdminCookie(role: Role = "OWNER") {
  const store = await cookies();
  store.set(COOKIE, "1", COOKIE_OPTIONS);
  store.set(ROLE_COOKIE, role, COOKIE_OPTIONS);
  store.set(SIG_COOKIE, signRole(role), COOKIE_OPTIONS);
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(ROLE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(SIG_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
