import type { NextRequest } from "next/server";
import type { SalesChannel } from "@/lib/types";
import { createOrder, listOrders } from "@/lib/server/store";
import { sendEmail } from "@/lib/server/mailer";

const CHANNELS: SalesChannel[] = ["website", "vinted", "depop", "ebay"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, items, deliveryCost, address, discountCode, channel } =
      body;

    if (!email || !name || !Array.isArray(items) || !address) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const channelValue = String(channel ?? "website") as SalesChannel;
    const finalChannel: SalesChannel = CHANNELS.includes(channelValue)
      ? channelValue
      : "website";

    const result = await createOrder({
      email: String(email),
      name: String(name),
      items: items.map((i: { sku?: unknown }) => ({ sku: String(i.sku) })),
      deliveryCost: Number(deliveryCost) || 0,
      address: {
        line1: String(address.line1 ?? ""),
        line2: address.line2 ? String(address.line2) : undefined,
        city: String(address.city ?? ""),
        postcode: String(address.postcode ?? ""),
        country: String(address.country ?? ""),
      },
      discountCode: discountCode ? String(discountCode) : undefined,
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

    try {
      console.log("Sending order-confirmed email (orders API)", { orderId: result.order.id, to: result.order.email });
      await sendEmail({
        to: result.order.email,
        template: "order-confirmed",
        data: { order: result.order },
      });
      console.log("Sent order-confirmed email (orders API)", { orderId: result.order.id });
    } catch (err) {
      console.error("Failed to send order-confirmed email (orders API):", err, { orderId: result.order.id, to: result.order.email });
    }

    return Response.json({ order: result.order }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  const orders = await listOrders(email);
  return Response.json({ orders });
}
