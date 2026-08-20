import type { NextRequest } from "next/server";
import { cancelPendingOrdersForEmail } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }
    cancelPendingOrdersForEmail(email);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
