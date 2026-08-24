import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const TABLES = [
  "products",
  "inventory_items",
  "orders",
  "order_items",
  "discounts",
  "purchase_leads",
  "newsletter_subscribers",
  "audit_logs",
] as const;

function missingEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: !process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const configured = supabaseConfigured();
  const db = getSupabase();
  const checks: Record<string, unknown> = {
    configured,
    missingEnv: missingEnv(),
  };

  if (!configured || !db) {
    return Response.json(
      {
        ok: false,
        error:
          "Supabase is not configured for server-side writes. Check Vercel production environment variables.",
        checks,
      },
      { status: 503 }
    );
  }

  let ok = true;

  for (const table of TABLES) {
    const { count, error } = await db
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      ok = false;
      checks[table] = { ok: false, error: error.message };
    } else {
      checks[table] = { ok: true, count };
    }
  }

  const testId = crypto.randomUUID();
  const writePayload = {
    id: testId,
    actor: "supabase-status",
    action: "connection test",
    detail: "admin Supabase status endpoint",
    at: new Date().toISOString(),
  };

  const { error: writeError } = await db.from("audit_logs").insert(writePayload);
  if (writeError) {
    ok = false;
    checks.write = { ok: false, error: writeError.message };
  } else {
    const { error: deleteError } = await db.from("audit_logs").delete().eq("id", testId);
    checks.write = deleteError
      ? { ok: false, inserted: true, cleanupError: deleteError.message }
      : { ok: true };
    if (deleteError) ok = false;
  }

  const { error: trackingColumnError } = await db
    .from("orders")
    .select("carrier, tracking", { count: "exact", head: true });
  if (trackingColumnError) {
    ok = false;
    checks.orderTrackingColumns = {
      ok: false,
      error: trackingColumnError.message,
      fix: "Run supabase/repair-2026-08-24.sql in Supabase SQL Editor.",
    };
  } else {
    checks.orderTrackingColumns = { ok: true };
  }

  const { error: unsubscribeColumnError } = await db
    .from("newsletter_subscribers")
    .select("unsubscribed_at", { count: "exact", head: true });
  if (unsubscribeColumnError) {
    ok = false;
    checks.unsubscribeColumn = {
      ok: false,
      error: unsubscribeColumnError.message,
      fix: "Run supabase/repair-2026-08-24.sql in Supabase SQL Editor.",
    };
  } else {
    checks.unsubscribeColumn = { ok: true };
  }

  return Response.json({ ok, checks }, { status: ok ? 200 : 500 });
}
