import { stripeEnabled } from "@/lib/server/payments";

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const enabled = stripeEnabled() && Boolean(publishableKey);
  return Response.json({
    mode: enabled ? "stripe" : "demo",
    publishableKey: enabled ? publishableKey : "",
  });
}
