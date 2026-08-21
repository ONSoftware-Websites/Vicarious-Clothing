import type { NextRequest } from "next/server";
import type { Discount, DiscountType } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import {
  deleteDiscount,
  listDiscounts,
  upsertDiscount,
} from "@/lib/server/store";

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "delete") {
      await deleteDiscount(String(body.id), "Henry");
      return Response.json({ ok: true });
    }

    if (action === "toggle") {
      const existing = (await listDiscounts()).find((d) => d.id === String(body.id));
      if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Discount = { ...existing, active: !existing.active };
      await upsertDiscount(updated, "Henry");
      return Response.json({ ok: true, discount: updated });
    }

    if (action === "save") {
      const discount = body.discount as Partial<Discount>;
      if (!discount.code || !discount.type) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const type = String(discount.type) as DiscountType;
      const value = type === "free_delivery" ? 0 : Number(discount.value ?? 0);

      const existing = discount.id
        ? (await listDiscounts()).find((d) => d.id === discount.id)
        : undefined;

      const full: Discount = {
        id: existing?.id ?? `disc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: String(discount.code).toUpperCase().replace(/\s+/g, ""),
        type,
        value,
        description: String(discount.description ?? ""),
        minBasket:
          discount.minBasket !== undefined && discount.minBasket !== null
            ? Number(discount.minBasket)
            : undefined,
        categories:
          Array.isArray(discount.categories) && discount.categories.length
            ? discount.categories.map(String)
            : undefined,
        expiresAt: discount.expiresAt ? String(discount.expiresAt) : undefined,
        usageLimit:
          discount.usageLimit !== undefined && discount.usageLimit !== null
            ? Number(discount.usageLimit)
            : undefined,
        usedCount: existing?.usedCount ?? 0,
        usedEmails: existing?.usedEmails ?? [],
        active: existing ? Boolean(discount.active) : true,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      await upsertDiscount(full, "Henry");
      return Response.json({ ok: true, discount: full });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
