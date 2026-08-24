import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  if (!supabaseConfigured()) {
    return Response.json(
      { ok: false, error: "Supabase is not configured on this deployment." },
      { status: 503 }
    );
  }

  const db = getSupabase();
  if (!db) {
    return Response.json(
      { ok: false, error: "Supabase client could not be created." },
      { status: 503 }
    );
  }

  try {
    const { data: products, error: productsError } = await db
      .from("products")
      .select("sku, listed_at");
    if (productsError) throw new Error(productsError.message);

    const rows = (products ?? []) as Array<{ sku: string; listed_at: string | null }>;
    if (rows.length === 0) {
      return Response.json({ ok: true, repaired: { inventoryItemsCreated: 0 } });
    }

    const skus = rows.map((row) => row.sku);
    const { data: existing, error: existingError } = await db
      .from("inventory_items")
      .select("sku")
      .in("sku", skus);
    if (existingError) throw new Error(existingError.message);

    const existingSet = new Set((existing ?? []).map((row) => String(row.sku)));
    const missing = rows.filter((row) => !existingSet.has(row.sku));

    if (missing.length) {
      const now = new Date().toISOString();
      const { error: insertError } = await db.from("inventory_items").insert(
        missing.map((row) => ({
          sku: row.sku,
          status: row.listed_at ? "AVAILABLE" : "DRAFT",
          created_at: now,
          updated_at: now,
        }))
      );
      if (insertError) throw new Error(insertError.message);
    }

    return Response.json({
      ok: true,
      repaired: {
        productsChecked: rows.length,
        inventoryItemsCreated: missing.length,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Supabase repair failed.",
      },
      { status: 500 }
    );
  }
}
