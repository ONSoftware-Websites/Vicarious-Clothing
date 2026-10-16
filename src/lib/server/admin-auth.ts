import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { adminEnabled } from "@/lib/admin-config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";

export { adminEnabled };

// Legacy shared-password sessions cannot grant administrator access.
export const COOKIE = "vc_admin";
export const ROLE_COOKIE = "vc_admin_role";
export const SIG_COOKIE = "vc_admin_sig";
export const COOKIE_OPTIONS = {
  httpOnly:true, sameSite:"lax" as const, path:"/",
  maxAge:60*60*12, secure:process.env.NODE_ENV === "production"
};
const ROLE_LEVEL: Record<Role,number> = {
  CUSTOMER:0, STAFF:1, MANAGER:2, ADMIN:3, OWNER:4, SUPER_ADMIN:5
};
export function checkPassword(_password:string) { return false; }
export function signAdminRole(_role:Role) { return ""; }

async function adminIdentity():Promise<Role> {
  const auth = await createSupabaseServer();
  const db = getSupabase();
  if (!auth || !db) return "CUSTOMER";
  const {data:{user},error} = await auth.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return "CUSTOMER";
  const {data:assurance,error:assuranceError} = await auth.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") return "CUSTOMER";
  const {data:member,error:memberError} = await db.from("admin_staff")
    .select("role,active").eq("user_id",user.id).maybeSingle();
  if (memberError || !member?.active || !Object.prototype.hasOwnProperty.call(ROLE_LEVEL,member.role))
    return "CUSTOMER";
  return member.role as Role;
}
export async function getAdminRole():Promise<Role> { return adminIdentity(); }
export async function isAdminSession() { return (await adminIdentity()) !== "CUSTOMER"; }
export async function requireRole(minRole:Role) {
  const current = await adminIdentity();
  return ROLE_LEVEL[current] >= ROLE_LEVEL[minRole];
}
export async function requireAdminApi(minRole:Role="STAFF") {
  if (!(await requireRole(minRole))) return Response.json({error:"Unauthorized"},{status:401});
  return null;
}
export async function setAdminCookie(_role:Role="OWNER") {
  throw new Error("Legacy admin sessions are disabled");
}
export async function clearAdminCookie() {
  const store = await cookies();
  for (const name of [COOKIE,ROLE_COOKIE,SIG_COOKIE]) store.set(name,"",{...COOKIE_OPTIONS,maxAge:0});
}
