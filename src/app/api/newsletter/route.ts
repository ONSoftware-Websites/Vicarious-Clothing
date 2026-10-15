import type { NextRequest } from "next/server";
import { enforcePublicRateLimit } from "@/lib/server/public-rate-limit";
import { subscribeNewsletter } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  const limited = await enforcePublicRateLimit(request, "newsletter");
  if (limited) return limited;
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const source = String(body.source ?? "website");
    const consent = body.consent === true || body.consent === "true";
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (!consent) {
      return Response.json({ error: "Please agree to receive marketing emails." }, { status: 400 });
    }
    const subscriber = await subscribeNewsletter(email, source);
    return Response.json({ ok: true, subscriber }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
