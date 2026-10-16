import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { COOKIE, ROLE_COOKIE, COOKIE_OPTIONS } from "@/lib/server/admin-auth";

export async function POST() {
  if (process.env.ADMIN_AUTH_V2 === "true") {
    const auth = await createSupabaseServer();
    await auth?.auth.signOut({ scope: "local" });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
