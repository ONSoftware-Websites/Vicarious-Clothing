import type { NextRequest } from "next/server";
import {
  evaluateDiscount,
  getProductBySku,
  listDiscounts,
} from "@/lib/server/store";

function normalizeSkus(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized: string[] = value
    .map((sku: unknown) => String(sku).trim().toUpperCase())
    .filter((sku: string) => sku.length > 0);
  return Array.from(new Set<string>(normalized));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      email?: unknown;
      skus?: unknown;
    };
    const code = String(body.code ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const skus = normalizeSkus(body.skus);

    if (!code) {
      return Response.json({ ok: false, error: "Enter a code." }, { status: 400 });
    }
    if (!email.includes("@") || skus.length === 0) {
      return Response.json(
        {
          ok: false,
          error: "Add your email and at least one piece before applying a code.",
        },
        { status: 400 }
      );
    }

    const products = [];
    for (const sku of skus) {
      const product = await getProductBySku(sku);
      if (!product) {
        return Response.json(
          { ok: false, error: "A piece in your bag is no longer available." },
          { status: 409 }
        );
      }
      products.push(product);
    }
    const subtotal =
      Math.round(products.reduce((sum, product) => sum + product.price, 0) * 100) /
      100;

    const definitions = await listDiscounts();
    const definition = definitions.find(
      (discount) => discount.code.toLowerCase() === code.toLowerCase()
    );
    if (definition?.categories?.length) {
      const hasIneligible = products.some(
        (product) => !definition.categories!.includes(product.category)
      );
      if (hasIneligible) {
        return Response.json(
          {
            ok: false,
            error:
              "That code can only be used when every piece in the bag is eligible.",
          },
          { status: 400 }
        );
      }
    }

    const result = await evaluateDiscount(code, {
      subtotal,
      email,
      itemSkus: skus,
    });
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
    return Response.json({ ok: true, discount: result.discount, subtotal });
  } catch (error) {
    console.error("Discount validation failed:", error);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
