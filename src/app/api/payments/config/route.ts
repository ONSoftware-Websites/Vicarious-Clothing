import { stripeEnabled } from "@/lib/server/payments";
import { productionRequiresSupabase } from "@/lib/server/supabase";

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const enabled = stripeEnabled() && Boolean(publishableKey);

  if (!enabled && productionRequiresSupabase()) {
    return Response.json(
      {
        mode: "unavailable",
        publishableKey: "",
        error: "Payments are not configured.",
      },
      { status: 503 }
    );
  }

  return Response.json({
    mode: enabled ? "stripe" : "demo",
    publishableKey: enabled ? publishableKey : "",
  });
}
