import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  COOKIE,
  COOKIE_OPTIONS,
  ROLE_COOKIE,
  SIG_COOKIE,
  signAdminRole,
} from "@/lib/server/admin-auth";

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

    const role = "OWNER" as const;
    const signature = signAdminRole(role);
    if (!signature) {
      return NextResponse.json(
        { error: "Admin session secret is not configured." },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, "1", COOKIE_OPTIONS);
    response.cookies.set(ROLE_COOKIE, role, COOKIE_OPTIONS);
    response.cookies.set(SIG_COOKIE, signature, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
