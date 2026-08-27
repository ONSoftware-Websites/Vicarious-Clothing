import type { NextRequest } from "next/server";
import type { Order } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { EMAILS } from "@/lib/site";
import { sendAdminOrderAlertOnce } from "@/lib/server/order-alerts";

function testOrder(toEmail: string): Order {
  const now = new Date().toISOString();
  return {
    id: `TEST-${Date.now()}`,
    email: toEmail,
    name: "Admin Alert Test",
    status: "PAID",
    items: [
      {
        sku: "TEST-SKU",
        name: "Paid Order Alert Test Item",
        brand: "Vicarious",
        size: "M",
        condition: "good",
        price: 1,
        image: "",
      },
    ],
    subtotal: 1,
    delivery: 0,
    total: 1,
    channel: "website",
    paymentProvider: "demo",
    address: {
      line1: "180 Swanlow Lane",
      city: "Winsford",
      postcode: "CW7 1JJ",
      country: "United Kingdom",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const recipient = String(body.to ?? EMAILS.owner).trim() || EMAILS.owner;
    const result = await sendAdminOrderAlertOnce(testOrder(recipient));

    return Response.json({
      ok: true,
      recipient,
      result,
      note: "If result.results contains a Resend id, Vicarious successfully handed the email to Resend. If Henry still cannot see it, check Resend delivery/suppression/spam for that id.",
    });
  } catch (error) {
    console.error("Admin order alert test failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin order alert test failed" },
      { status: 500 }
    );
  }
}
