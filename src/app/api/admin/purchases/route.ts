import type { NextRequest } from "next/server";
import type { StockPurchase } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import {
  createPurchase,
  getProductBySku,
  markPurchasePaid,
} from "@/lib/server/store";

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "paid") {
      const purchase = await markPurchasePaid(String(body.id), "Henry");
      if (!purchase) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ ok: true, purchase });
    }

    if (action === "save") {
      const purchase = body.purchase as Partial<StockPurchase>;
      if (!purchase.sellerName || !purchase.amount) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const items = [];
      for (const raw of Array.isArray(purchase.items) ? purchase.items : []) {
        const item = raw as { sku?: string; cost?: number };
        const sku = String(item.sku ?? "");
        const cost = Number(item.cost ?? 0);
        const product = await getProductBySku(sku);
        if (!sku) continue;
        items.push({
          sku,
          name: product?.name ?? sku,
          brand: product?.brand ?? "",
          cost,
        });
      }

      const full: StockPurchase = {
        id: purchase.id ?? `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sellerName: String(purchase.sellerName),
        sellerEmail: String(purchase.sellerEmail ?? ""),
        amount: Number(purchase.amount),
        status: purchase.status === "PAID" ? "PAID" : "AGREED",
        items,
        notes: purchase.notes ? String(purchase.notes) : undefined,
        leadId: purchase.leadId ? String(purchase.leadId) : undefined,
        createdAt: purchase.createdAt ?? new Date().toISOString(),
        paidAt: purchase.paidAt,
      };

      const saved = await createPurchase(
        {
          sellerName: full.sellerName,
          sellerEmail: full.sellerEmail,
          amount: full.amount,
          status: full.status,
          items: full.items,
          notes: full.notes,
          leadId: full.leadId,
        },
        "Henry"
      );

      if (full.status === "PAID") await markPurchasePaid(saved.id, "Henry");

      return Response.json({ ok: true, purchase: saved });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
