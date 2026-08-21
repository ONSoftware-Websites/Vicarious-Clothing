import { NextResponse } from "next/server";
import { COOKIE, ROLE_COOKIE, COOKIE_OPTIONS } from "@/lib/server/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set(ROLE_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
