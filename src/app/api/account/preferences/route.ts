import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAuth = await createSupabaseServer();
  if (!supabaseAuth) return NextResponse.json({ marketing: false });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ marketing: false });

  const db = getSupabase();
  if (!db) return NextResponse.json({ marketing: false });
  const { data } = await db.from("marketing_consents").select("marketing").eq("profile_id", user.id).maybeSingle();
  return NextResponse.json({ marketing: Boolean(data?.marketing) });
}

export async function POST(request: NextRequest) {
  const supabaseAuth = await createSupabaseServer();
  if (!supabaseAuth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { marketing } = await request.json();
  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { error } = await db.from("marketing_consents").upsert({
    profile_id: user.id,
    marketing: Boolean(marketing),
    consented_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "profile_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, marketing: Boolean(marketing) });
}
