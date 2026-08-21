import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseAuth = await createSupabaseServer();
  if (!supabaseAuth) return NextResponse.json({ addresses: [] });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ addresses: [] });

  const db = getSupabase();
  if (!db) return NextResponse.json({ addresses: [] });
  const { data, error } = await db.from("addresses").select("*").eq("profile_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabaseAuth = await createSupabaseServer();
  if (!supabaseAuth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { line1, line2, city, postcode, country } = body;
  if (!line1 || !city || !postcode) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await db.from("addresses").insert({
    profile_id: user.id,
    line1: String(line1),
    line2: line2 ? String(line2) : null,
    city: String(city),
    postcode: String(postcode),
    country: String(country || "United Kingdom"),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabaseAuth = await createSupabaseServer();
  if (!supabaseAuth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getSupabase();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { error } = await db.from("addresses").delete().eq("id", id).eq("profile_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
