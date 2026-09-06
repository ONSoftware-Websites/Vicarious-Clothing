import { RESERVATION_MINUTES } from "@/lib/site";
import { getSupabase } from "@/lib/server/supabase";
import { releaseProducts, reserveProducts } from "@/lib/server/store";

export interface CheckoutStockOptions {
  holdToken?: string;
  orderId?: string;
}

function uniqueSkus(skus: string[]) {
  return [...new Set(skus.map((s) => s.toUpperCase()).filter(Boolean))];
}

function rpcMissing(message: string) {
  return /function .* does not exist|could not find .*function|schema cache|claim_checkout_hold|release_checkout_hold|attach_checkout_hold/i.test(message);
}

function claimedFromRpc(data: unknown) {
  return Array.isArray(data)
    ? data.map((row: unknown) => {
        if (typeof row === "string") return row;
        if (row && typeof row === "object" && "sku" in row) {
          return String((row as { sku: unknown }).sku);
        }
        return "";
      }).filter(Boolean)
    : [];
}

export async function claimCheckoutStock(
  skus: string[],
  options: CheckoutStockOptions = {}
) {
  const unique = uniqueSkus(skus);
  const db = getSupabase();

  if (!db) {
    return reserveProducts(unique);
  }

  if (options.holdToken) {
    const { data, error } = await db.rpc("claim_checkout_hold", {
      p_skus: unique,
      p_hold_token: options.holdToken,
    });

    if (!error) {
      const claimed = claimedFromRpc(data);
      const claimedSet = new Set(claimed.map((s) => s.toUpperCase()));
      return {
        ok: unique.filter((sku) => claimedSet.has(sku)),
        gone: unique.filter((sku) => !claimedSet.has(sku)),
      };
    }

    // Deployment safety: if the SQL repair has not been run yet, keep checkout
    // working with the older timed RPC until the new hold functions exist.
    if (!rpcMissing(error.message)) {
      throw new Error(`Could not hold stock: ${error.message}`);
    }
  }

  const { data, error } = await db.rpc("claim_inventory", {
    p_skus: unique,
    p_minutes: RESERVATION_MINUTES,
  });
  if (error) throw new Error(`Could not reserve stock: ${error.message}`);

  const claimed = claimedFromRpc(data);
  const claimedSet = new Set(claimed.map((s) => s.toUpperCase()));
  return {
    ok: unique.filter((sku) => claimedSet.has(sku)),
    gone: unique.filter((sku) => !claimedSet.has(sku)),
  };
}

export async function attachCheckoutHoldToOrder(
  skus: string[],
  holdToken: string | undefined,
  orderId: string | undefined
) {
  const unique = uniqueSkus(skus);
  if (!holdToken || !orderId || unique.length === 0) return { attached: [] as string[] };

  const db = getSupabase();
  if (!db) return { attached: unique };

  const { data, error } = await db.rpc("attach_checkout_hold_to_order", {
    p_skus: unique,
    p_hold_token: holdToken,
    p_order_id: orderId,
  });

  if (error) {
    if (rpcMissing(error.message)) {
      console.warn("Checkout hold order attachment skipped; SQL repair has not been applied yet.");
      return { attached: [] as string[] };
    }
    throw new Error(`Could not attach checkout hold to order: ${error.message}`);
  }

  return { attached: claimedFromRpc(data) };
}

export async function releaseCheckoutStock(
  skus: string[],
  options: CheckoutStockOptions = {}
) {
  const unique = uniqueSkus(skus);
  if (!unique.length) return { released: [] as string[] };

  const db = getSupabase();
  if (!db) {
    await releaseProducts(unique);
    return { released: unique };
  }

  if (options.holdToken || options.orderId) {
    const { data, error } = await db.rpc("release_checkout_hold", {
      p_skus: unique,
      p_hold_token: options.holdToken ?? null,
      p_order_id: options.orderId ?? null,
    });

    if (!error) return { released: claimedFromRpc(data) };

    if (!rpcMissing(error.message)) {
      throw new Error(`Could not release checkout hold: ${error.message}`);
    }
  }

  // Legacy fallback for pre-hold SQL deployments and local compatibility.
  await releaseProducts(unique);
  return { released: unique };
}
