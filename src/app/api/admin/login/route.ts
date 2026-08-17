import type { NextRequest } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/server/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!checkPassword(String(body.password ?? ""))) {
      return Response.json({ error: "Wrong password" }, { status: 401 });
    }
    await setAdminCookie();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
