import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { adminEnabled } from "@/lib/admin-config";

export const COOKIE = "vc_admin";
export const ROLE_COOKIE = "vc_admin_role";

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

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true;
  return password === expected;
}

export async function isAdminSession() {
  if (!adminEnabled()) return true;
  const store = await cookies();
  return store.get(COOKIE)?.value === "1";
}

export async function getAdminRole(): Promise<Role> {
  const store = await cookies();
  const role = store.get(ROLE_COOKIE)?.value as Role | undefined;
  return role && ROLE_LEVEL[role] !== undefined ? role : "OWNER";
}

export async function requireRole(minRole: Role) {
  const role = await getAdminRole();
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

export async function requireAdminApi() {
  if (adminEnabled() && !(await isAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function setAdminCookie(role: Role = "OWNER") {
  const store = await cookies();
  store.set(COOKIE, "1", COOKIE_OPTIONS);
  store.set(ROLE_COOKIE, role, COOKIE_OPTIONS);
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  store.set(ROLE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
