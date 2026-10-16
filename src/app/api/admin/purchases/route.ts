import {getSupabase} from "@/lib/server/supabase";
import {getSupabaseUser} from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import type { StockPurchase } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { adminDeletePurchase } from "@/lib/server/admin-delete";
import {
  createPurchase,
  getProductBySku,
} from "@/lib/server/store";

const ACTOR = "Admin";

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi("ADMIN");
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "paid") {
      const id=String(body.id??"").trim();
      const paymentReference=String(body.paymentReference??"").trim();
      if(!id||paymentReference.length<4||paymentReference.length>120)
        return Response.json({error:"Enter a real external payment reference (4–120 characters)"},{status:400});
      const user=await getSupabaseUser();
      const db=getSupabase();
      if(!user||!db)return Response.json({error:"Service unavailable"},{status:503});
      const {data, error}=await db.rpc("confirm_stock_purchase_payment",{
        p_purchase_id:id,p_reference:paymentReference,p_actor_id:user.id
      });
      if(error){
        console.error("Purchase payment reconciliation failed",error);
        return Response.json({error:"Payment cannot be recorded yet. Check seller inspection, stock intake and the linked inventory, or contact an administrator."},{status:409});
      }
      if(!data)return Response.json({error:"Purchase not found"},{status:404});
      return Response.json({ok:true,paid:true});
    }

    if (action === "delete") {
      await adminDeletePurchase(String(body.id), ACTOR);
      return Response.json({ ok: true });
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
        ACTOR
      );

      if (full.status === "PAID") await markPurchasePaid(saved.id, ACTOR);

      return Response.json({ ok: true, purchase: saved });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin purchase action failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin purchase action failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminApi("ADMIN");
  if (authError) return authError;
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  try {
    await adminDeletePurchase(id, ACTOR);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Purchase delete failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Purchase delete failed" },
      { status: 500 }
    );
  }
}
