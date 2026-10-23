import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireRole("ADMIN"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
  const { data, error } = await db.from("analytics_excluded_ips")
    .select("ip_address,label,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load excluded IPs. Apply the traffic analytics migration first." }, { status: 503 });
  return NextResponse.json({ addresses: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!(await requireRole("ADMIN"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { ip?: unknown; label?: unknown } | null;
  const ip = typeof body?.ip === "string" ? body.ip.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 100) : "";
  if (isIP(ip) === 0) return NextResponse.json({ error: "Enter a valid IPv4 or IPv6 address." }, { status: 400 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
  const { error } = await db.from("analytics_excluded_ips").upsert({ ip_address: ip, label }, { onConflict: "ip_address" });
  if (error) return NextResponse.json({ error: "Could not save the excluded IP address." }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireRole("ADMIN"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = request.nextUrl.searchParams.get("ip")?.trim() ?? "";
  if (isIP(ip) === 0) return NextResponse.json({ error: "Invalid IP address." }, { status: 400 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
  const { error } = await db.from("analytics_excluded_ips").delete().eq("ip_address", ip);
  if (error) return NextResponse.json({ error: "Could not remove the excluded IP address." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
