import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { recordVisit } from "@/lib/server/store";
import { isAdminSession } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

function safePath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/, 1)[0].slice(0, 300);
  if (!path || path.startsWith("/admin") || path.startsWith("/api")) return null;
  return path;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    path?: unknown; visitorId?: unknown; sessionId?: unknown;
    referrerHost?: unknown; newSession?: unknown;
  } | null;
  const path = safePath(body?.path);
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId.slice(0, 80) : "";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 80) : "";
  if (!path || !/^[a-zA-Z0-9_-]{8,80}$/.test(visitorId) || !/^[a-zA-Z0-9_-]{8,80}$/.test(sessionId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Authenticated staff/admin sessions are excluded regardless of the network or browser IP.
  if (await isAdminSession()) return NextResponse.json({ ok: true, excluded: true, reason: "admin-session" });

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });

  // Vercel sets x-real-ip at the edge. Do not trust client-controlled forwarded headers.
  const ip = request.headers.get("x-real-ip")?.trim() ?? "";
  if (!ip || isIP(ip) === 0) return NextResponse.json({ ok: false }, { status: 503 });

  const { data: excluded, error: exclusionError } = await db
    .from("analytics_excluded_ips").select("ip_address").eq("ip_address", ip).maybeSingle();
  if (exclusionError) return NextResponse.json({ error: "Analytics configuration unavailable" }, { status: 503 });
  if (excluded) return NextResponse.json({ ok: true, excluded: true });

  const referrerHost = typeof body?.referrerHost === "string"
    ? (() => { try { return new URL(body.referrerHost).hostname.slice(0, 200) || null; } catch { return null; } })()
    : null;
  const { error } = await db.from("analytics_events").insert({
    event_type: "page_view", visitor_id: visitorId, session_id: sessionId, path, referrer_host: referrerHost,
  });
  if (error) return NextResponse.json({ error: "Could not record analytics event" }, { status: 503 });

  if (body?.newSession === true) await recordVisit();
  return NextResponse.json({ ok: true });
}
