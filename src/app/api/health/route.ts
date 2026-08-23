import { getSupabase, supabaseConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};
  let ok = true;

  const configured = supabaseConfigured();
  checks.configuration = {
    supabase: configured,
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
    stripePublishable: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    leadAccessSecret: Boolean(
      process.env.LEAD_OFFER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };

  if (
    process.env.NODE_ENV === "production" &&
    (!configured ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.STRIPE_SECRET_KEY ||
      !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      !process.env.STRIPE_WEBHOOK_SECRET ||
      !process.env.RESEND_API_KEY)
  ) {
    ok = false;
  }

  if (!configured) {
    return Response.json(
      {
        ok: false,
        checks,
        seedDemo: process.env.SEED_DEMO ?? "(unset)",
        vercel: process.env.VERCEL ?? null,
      },
      { status: 503 }
    );
  }

  const supabase = getSupabase()!;
  const tables = [
    "products",
    "inventory_items",
    "orders",
    "journal_posts",
    "newsletter_subscribers",
    "discounts",
    "email_log",
    "purchase_leads",
  ] as const;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        ok = false;
        checks[table] = { ok: false, error: error.message };
      } else {
        checks[table] = { ok: true, count };
      }
    } catch (error) {
      ok = false;
      checks[table] = { ok: false, error: String(error) };
    }
  }

  // Safe no-op call proves the atomic checkout claim migration has been applied.
  try {
    const { error } = await supabase.rpc("claim_inventory", {
      p_skus: ["__HEALTHCHECK_DO_NOT_CREATE__"],
      p_minutes: 1,
    });
    if (error) {
      ok = false;
      checks.claimInventoryRpc = { ok: false, error: error.message };
    } else {
      checks.claimInventoryRpc = { ok: true };
    }
  } catch (error) {
    ok = false;
    checks.claimInventoryRpc = { ok: false, error: String(error) };
  }

  try {
    const { data, error } = await supabase.storage.getBucket("lead-photos");
    if (error || !data) {
      ok = false;
      checks.leadPhotoBucket = { ok: false, error: error?.message ?? "Bucket missing" };
    } else {
      checks.leadPhotoBucket = { ok: true, public: data.public };
    }
  } catch (error) {
    ok = false;
    checks.leadPhotoBucket = { ok: false, error: String(error) };
  }

  return Response.json(
    {
      ok,
      checks,
      seedDemo: process.env.SEED_DEMO ?? "(unset)",
      vercel: process.env.VERCEL ?? null,
    },
    { status: ok ? 200 : 500 }
  );
}
