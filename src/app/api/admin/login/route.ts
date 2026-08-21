import { NextRequest, NextResponse } from "next/server";
import { checkPassword, COOKIE, ROLE_COOKIE, COOKIE_OPTIONS } from "@/lib/server/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin password not configured on server — set ADMIN_PASSWORD" },
        { status: 503 }
      );
    }
    if (!checkPassword(String(body.password ?? ""))) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, "1", COOKIE_OPTIONS);
    response.cookies.set(ROLE_COOKIE, "OWNER", COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
