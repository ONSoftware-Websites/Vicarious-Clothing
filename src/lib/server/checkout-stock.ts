import { RESERVATION_MINUTES } from "@/lib/site";
import { getSupabase } from "@/lib/server/supabase";
import { releaseProducts, reserveProducts } from "@/lib/server/store";

export async function claimCheckoutStock(skus: string[]) {
  const unique = [...new Set(skus.map((s) => s.toUpperCase()))];
  const db = getSupabase();

  if (!db) {
    return reserveProducts(unique);
  }

  const { data, error } = await db.rpc("claim_inventory", {
    p_skus: unique,
    p_minutes: RESERVATION_MINUTES,
  });
  if (error) throw new Error(`Could not reserve stock: ${error.message}`);

  const claimed = Array.isArray(data)
    ? data.map((row: unknown) => {
        if (typeof row === "string") return row;
        if (row && typeof row === "object" && "sku" in row) {
          return String((row as { sku: unknown }).sku);
        }
        return "";
      }).filter(Boolean)
    : [];

  const claimedSet = new Set(claimed.map((s) => s.toUpperCase()));
  return {
    ok: unique.filter((sku) => claimedSet.has(sku)),
    gone: unique.filter((sku) => !claimedSet.has(sku)),
  };
}

export async function releaseCheckoutStock(skus: string[]) {
  await releaseProducts([...new Set(skus.map((s) => s.toUpperCase()))]);
}
