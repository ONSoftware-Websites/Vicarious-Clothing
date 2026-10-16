import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { adminEnabled } from "@/lib/admin-config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";

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
  SUPER_ADMIN: 5,
};

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function signAdminRole(role: Role) {
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

async function adminIdentity(): Promise<Role> {
  const auth = await createSupabaseServer();
  if (!auth) return "CUSTOMER";
  const {data:{user},error} = await auth.auth.getUser();
  if (error || !user) return "CUSTOMER";
  const {data:aal} = await auth.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return "CUSTOMER";
  const db = getSupabase();
  if (!db) return "CUSTOMER";
  const {data,error:membershipError} = await db.from("admin_staff")
    .select("role,active").eq("user_id",user.id).maybeSingle();
  if (membershipError || !data?.active) return "CUSTOMER";
  return (data.role in ROLE_LEVEL && data.role !== "CUSTOMER") ? data.role as Role : "CUSTOMER";
}

export async function isAdminSession() {
  return (await adminIdentity()) !== "CUSTOMER";
  /* legacy session disabled

  const store = await cookies();
  if (store.get(COOKIE)?.value !== "1") return false;
  const role = parseRole(store.get(ROLE_COOKIE)?.value);
  const signature = store.get(SIG_COOKIE)?.value ?? "";
  const expected = signAdminRole(role);
  return Boolean(expected) && safeEqualHex(signature, expected);
  */
}

export async function getAdminRole(): Promise<Role> {
  return adminIdentity();
  /* legacy session disabled
  if (!(await isAdminSession())) return "CUSTOMER";
  const store = await cookies();
  return parseRole(store.get(ROLE_COOKIE)?.value);
  */
}

export async function requireRole(minRole: Role) {
  const role = await getAdminRole();
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

export async function requireAdminApi(minRole: Role = "STAFF") {
  if (!(await requireRole(minRole))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function setAdminCookie(role: Role = "OWNER") {
  const store = await cookies();
  store.set(COOKIE, "1", COOKIE_OPTIONS);
  store.set(ROLE_COOKIE, role, COOKIE_OPTIONS);
  store.set(SIG_COOKIE, signAdminRole(role), COOKIE_OPTIONS);
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(ROLE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(SIG_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
