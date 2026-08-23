import type { NextRequest } from "next/server";
import type { SalesChannel } from "@/lib/types";
import { createOrder, listOrders } from "@/lib/server/store";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabaseUser } from "@/lib/supabase/server";

const CHANNELS: SalesChannel[] = ["website", "vinted", "depop", "ebay"];

// Legacy/manual order creation is staff-only. Website customers must use
// /api/checkout so payment is verified before an order becomes PAID.
export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, name, items, deliveryCost, address, discountCode, channel } = body;

    if (!email || !name || !Array.isArray(items) || !items.length || !address) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const channelValue = String(channel ?? "website") as SalesChannel;
    const finalChannel: SalesChannel = CHANNELS.includes(channelValue)
      ? channelValue
      : "website";

    const result = await createOrder({
      email: String(email).trim().toLowerCase(),
      name: String(name).trim(),
      items: items.map((i: { sku?: unknown }) => ({
        sku: String(i.sku ?? "").trim().toUpperCase(),
      })),
      deliveryCost: Math.max(0, Number(deliveryCost) || 0),
      address: {
        line1: String(address.line1 ?? "").trim(),
        line2: address.line2 ? String(address.line2).trim() : undefined,
        city: String(address.city ?? "").trim(),
        postcode: String(address.postcode ?? "").trim().toUpperCase(),
        country: String(address.country ?? "United Kingdom").trim(),
      },
      discountCode: discountCode ? String(discountCode).trim() : undefined,
      channel: finalChannel,
      status: "PAID",
      paymentProvider: "demo",
    });

    if (result.gone?.length) {
      return Response.json({ gone: result.gone }, { status: 409 });
    }
    if (!result.order) {
      return Response.json({ error: "Could not create order" }, { status: 500 });
    }

    return Response.json({ order: result.order }, { status: 201 });
  } catch (error) {
    console.error("Manual order creation failed:", error);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

// A customer may only retrieve orders belonging to their authenticated Supabase
// account. The old ?email= query was an IDOR that exposed any customer's orders.
export async function GET() {
  const user = await getSupabaseUser();
  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await listOrders(user.email);
  return Response.json({ orders });
}
