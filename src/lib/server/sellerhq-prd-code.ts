import { getSupabase } from "@/lib/server/supabase";

const MISSING_COLUMN_HELP =
  "SellerHQ PRD code storage is not ready. Run supabase/repair-2026-08-25-sellerhq-prd-code.sql in Supabase SQL Editor.";

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function normalizePrdCode(code: unknown) {
  const value = code === null || code === undefined ? "" : String(code).trim();
  return value || null;
}

function isMissingColumnError(error: { message?: string; code?: string }) {
  const message = error.message ?? "";
  return error.code === "42703" || message.includes("sellerhq_prd_code");
}

export async function getSellerHqPrdCode(sku: string): Promise<string> {
  const db = getSupabase();
  if (!db) return "";

  const { data, error } = await db
    .from("inventory_items")
    .select("sellerhq_prd_code")
    .eq("sku", normalizeSku(sku))
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) throw new Error(MISSING_COLUMN_HELP);
    throw new Error(error.message);
  }

  return data?.sellerhq_prd_code ? String(data.sellerhq_prd_code) : "";
}

export async function getSellerHqPrdCodes(skus: string[]): Promise<Record<string, string>> {
  const db = getSupabase();
  if (!db || skus.length === 0) return {};

  const normalized = [...new Set(skus.map(normalizeSku).filter(Boolean))];
  if (normalized.length === 0) return {};

  const { data, error } = await db
    .from("inventory_items")
    .select("sku, sellerhq_prd_code")
    .in("sku", normalized);

  if (error) {
    if (isMissingColumnError(error)) throw new Error(MISSING_COLUMN_HELP);
    throw new Error(error.message);
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [
      String(row.sku),
      row.sellerhq_prd_code ? String(row.sellerhq_prd_code) : "",
    ])
  );
}

export async function setSellerHqPrdCode(sku: string, code: unknown) {
  const db = getSupabase();
  if (!db) throw new Error("Supabase is not configured. SellerHQ PRD code was not saved.");

  const { error } = await db
    .from("inventory_items")
    .update({
      sellerhq_prd_code: normalizePrdCode(code),
      updated_at: new Date().toISOString(),
    })
    .eq("sku", normalizeSku(sku));

  if (error) {
    if (isMissingColumnError(error)) throw new Error(MISSING_COLUMN_HELP);
    throw new Error(error.message);
  }
}
