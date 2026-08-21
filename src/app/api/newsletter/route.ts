import type { NextRequest } from "next/server";
import { subscribeNewsletter } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const source = String(body.source ?? "website");
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email." }, { status: 400 });
    }
    const subscriber = await subscribeNewsletter(email, source);
    return Response.json({ ok: true, subscriber }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
