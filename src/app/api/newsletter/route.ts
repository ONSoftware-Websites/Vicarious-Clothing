import type { NextRequest } from "next/server";
import { subscribeNewsletter } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const source = String(body.source ?? "website");
    const consent = body.consent === true || body.consent === "true";
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email." }, { status: 400 });
    }
    // Homepage and checkout now send consent=true; legacy callers without consent are treated as consented for backward compat but admin should always require it
    if (source === "homepage" && !consent) {
      return Response.json({ error: "Please agree to receive marketing emails." }, { status: 400 });
    }
    const subscriber = await subscribeNewsletter(email, source);
    return Response.json({ ok: true, subscriber }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
