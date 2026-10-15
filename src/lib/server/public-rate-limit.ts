import "server-only";
import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getSupabase } from "@/lib/server/supabase";

type Scope = "newsletter" | "leads" | "reserve" | "checkout";
const limits: Record<Scope, { max: number; seconds: number }> = {
  newsletter: { max: 5, seconds: 3600 },
  leads: { max: 3, seconds: 3600 },
  reserve: { max: 25, seconds: 600 },
  checkout: { max: 15, seconds: 600 },
};

export async function enforcePublicRateLimit(request: NextRequest, scope: Scope) {
  const config = limits[scope];
  // Only trust forwarding headers supplied by the configured reverse proxy.
  // Vercel overrides x-real-ip with the connecting client's address.
  const ip = request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip && process.env.NODE_ENV === "production") {
    return Response.json({ error: "Unable to verify request origin" }, { status: 503 });
  }
  const key = createHash("sha256")
    .update(scope + ":" + (ip || "local") + ":" + (process.env.RATE_LIMIT_SALT || "vicarious"))
    .digest("hex");
  const db = getSupabase();
  if (!db) {
    if (process.env.NODE_ENV === "production")
      return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
    return null;
  }
  const { data, error } = await db.rpc("check_public_rate_limit", {
    p_key: key, p_limit: config.max, p_window_seconds: config.seconds,
  });
  if (error) {
    console.error("Public rate limit unavailable:", error.message);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
  if (data !== true)
    return Response.json({ error: "Too many requests. Please try again later." }, {
      status: 429, headers: { "Retry-After": String(config.seconds) },
    });
  return null;
}
