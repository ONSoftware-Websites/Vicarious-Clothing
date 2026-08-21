import { getSupabase, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = supabaseConfigured();
  if (!configured) {
    return Response.json({
      ok: false,
      supabase: { configured: false, error: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" },
      seedDemo: process.env.SEED_DEMO ?? "(unset — demo seed active)",
      vercel: process.env.VERCEL ?? null,
    }, { status: 503 });
  }

  const supabase = getSupabase()!;
  const checks: Record<string, unknown> = {};
  let ok = true;

  // Minimal connectivity check: count products, orders, posts, etc.
  const tables = [
    "products",
    "inventory_items",
    "orders",
    "journal_posts",
    "newsletter_subscribers",
    "discounts",
  ] as const;

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        ok = false;
        checks[table] = { error: error.message };
      } else {
        checks[table] = { count };
      }
    } catch (e) {
      ok = false;
      checks[table] = { error: String(e) };
    }
  }

  // Auth check: can we read products with a sample query?
  try {
    const { data, error } = await supabase.from("products").select("sku").limit(1);
    if (error) {
      ok = false;
      checks["sample_query"] = { error: error.message };
    } else {
      checks["sample_query"] = { ok: true, sample_sku: data?.[0]?.sku ?? null };
    }
  } catch (e) {
    ok = false;
    checks["sample_query"] = { error: String(e) };
  }

  return Response.json({
    ok,
    supabase: { configured: true, url: process.env.NEXT_PUBLIC_SUPABASE_URL },
    seedDemo: process.env.SEED_DEMO ?? "(unset — demo seed active)",
    vercel: process.env.VERCEL ?? null,
    checks,
  }, { status: ok ? 200 : 500 });
}
