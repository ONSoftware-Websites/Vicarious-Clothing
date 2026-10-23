import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireRole("ADMIN"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });

  const requestedDays = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: events, error } = await db.from("analytics_events")
    .select("visitor_id,session_id,path,referrer_host,created_at")
    .gte("created_at", since).order("created_at", { ascending: true }).limit(50000);
  if (error) return NextResponse.json({ error: "Could not load traffic analytics. Apply the traffic analytics migration first." }, { status: 503 });

  const rows = events ?? [];
  const byDay = new Map<string, { pageViews: number; sessions: Set<string>; visitors: Set<string> }>();
  const pages = new Map<string, number>();
  const referrers = new Map<string, number>();
  const sessions = new Set<string>();
  const visitors = new Set<string>();
  for (const row of rows) {
    const day = String(row.created_at).slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { pageViews: 0, sessions: new Set(), visitors: new Set() });
    const daily = byDay.get(day)!;
    daily.pageViews++;
    daily.sessions.add(row.session_id);
    daily.visitors.add(row.visitor_id);
    sessions.add(row.session_id);
    visitors.add(row.visitor_id);
    pages.set(row.path, (pages.get(row.path) ?? 0) + 1);
    if (row.referrer_host) referrers.set(row.referrer_host, (referrers.get(row.referrer_host) ?? 0) + 1);
  }

  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 86400000);
    const key = date.toISOString().slice(0, 10);
    const item = byDay.get(key);
    return { date: key, pageViews: item?.pageViews ?? 0, sessions: item?.sessions.size ?? 0, visitors: item?.visitors.size ?? 0 };
  });
  return NextResponse.json({
    days, pageViews: rows.length, sessions: sessions.size, uniqueVisitors: visitors.size,
    daily, topPages: [...pages].map(([path, count]) => ({ path, count })).sort((a,b)=>b.count-a.count).slice(0,10),
    topReferrers: [...referrers].map(([host,count])=>({host,count})).sort((a,b)=>b.count-a.count).slice(0,10),
    capped: rows.length === 50000,
  }, { headers: { "Cache-Control": "no-store" } });
}
