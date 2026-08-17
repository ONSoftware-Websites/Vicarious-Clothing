import type { NextRequest } from "next/server";
import type { Product } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import {
  duplicateProduct,
  getProductBySku,
  nextSku,
  setProductStatus,
  upsertProduct,
} from "@/lib/server/store";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "duplicate") {
      const copy = duplicateProduct(String(body.sku), "Henry");
      if (!copy) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ ok: true, sku: copy.sku });
    }

    if (action === "status") {
      const status = String(body.status);
      if (!["AVAILABLE", "SOLD", "ARCHIVED", "DRAFT"].includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      setProductStatus(String(body.sku), status as Product["status"]);
      return Response.json({ ok: true });
    }

    if (action === "discount") {
      const sku = String(body.sku);
      const newPrice = Number(body.price);
      const product = getProductBySku(sku);
      if (!product) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Product = {
        ...product,
        compareAtPrice: product.price,
        price: newPrice,
      };
      upsertProduct(
        updated,
        "Henry",
        `${sku} discounted to £${newPrice.toFixed(2)}`
      );
      return Response.json({ ok: true });
    }

    if (action === "marketplace") {
      const sku = String(body.sku);
      const channel = String(body.channel);
      const status = String(body.status);
      if (!["LISTED", "NOT_LISTED"].includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      const product = getProductBySku(sku);
      if (!product) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Product = {
        ...product,
        marketplace: product.marketplace.map((m) =>
          m.channel === channel ? { ...m, status: status as never } : m
        ),
      };
      upsertProduct(
        updated,
        "Henry",
        `${sku} ${channel}: ${status}`
      );
      return Response.json({ ok: true });
    }

    if (action === "sold_elsewhere") {
      const sku = String(body.sku);
      const channel = String(body.channel);
      const product = getProductBySku(sku);
      if (!product) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Product = {
        ...product,
        status: "SOLD",
        soldAt: new Date().toISOString(),
        marketplace: product.marketplace.map((m) =>
          m.channel === channel || m.channel === "website"
            ? { ...m, status: "NOT_LISTED" }
            : m
        ),
      };
      upsertProduct(
        updated,
        "Henry",
        `${sku} sold on ${channel} — website delisted`
      );
      return Response.json({ ok: true });
    }

    if (action === "save") {
      const product = body.product as Partial<Product>;
      if (!product.name || !product.brand || !product.category || !product.condition) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      const existing = product.sku ? getProductBySku(product.sku) : undefined;
      const sku = existing ? existing.sku : nextSku();
      const slug = existing
        ? existing.slug
        : `${sku.toLowerCase()}-${slugify(product.brand)}-${slugify(product.name)}`;

      const full: Product = {
        sku,
        slug,
        name: String(product.name),
        brand: String(product.brand),
        category: product.category as Product["category"],
        size: String(product.size ?? ""),
        colour: String(product.colour ?? ""),
        material: String(product.material ?? ""),
        condition: product.condition as Product["condition"],
        conditionNotes: String(product.conditionNotes ?? ""),
        measurements: Array.isArray(product.measurements)
          ? product.measurements
              .filter((m: { label?: string; value?: string }) => m.label && m.value)
              .map((m: { label: string; value: string }) => ({
                label: m.label,
                value: m.value,
              }))
          : [],
        description: String(product.description ?? ""),
        defects: Array.isArray(product.defects)
          ? product.defects.filter(Boolean).map(String)
          : [],
        tags: Array.isArray(product.tags)
          ? product.tags.filter(Boolean).map(String)
          : [],
        price: Number(product.price ?? 0),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : undefined,
        cost:
          product.cost !== undefined && product.cost !== null
            ? Number(product.cost)
            : undefined,
        floorPrice:
          product.floorPrice !== undefined && product.floorPrice !== null
            ? Number(product.floorPrice)
            : undefined,
        images: Array.isArray(product.images) && product.images.length
          ? product.images.map((i: { src?: string; alt?: string }, idx: number) => ({
              src: String(i.src ?? ""),
              alt: i.alt || `${product.brand} ${product.name} - image ${idx + 1}`,
            }))
          : existing?.images ?? [],
        status: (product.status as Product["status"]) ?? "DRAFT",
        location: product.location ? String(product.location) : undefined,
        listedAt:
          product.status === "AVAILABLE" && !existing?.listedAt
            ? new Date().toISOString()
            : existing?.listedAt ?? new Date().toISOString(),
        soldAt: existing?.soldAt,
        reservedUntil: existing?.reservedUntil,
        acquisitionSource: product.acquisitionSource
          ? String(product.acquisitionSource)
          : undefined,
        purchaseDate: product.purchaseDate
          ? String(product.purchaseDate)
          : undefined,
        marketplace: Array.isArray(product.marketplace) && product.marketplace.length
          ? product.marketplace.map((m: { channel: string; status: string }) => ({
              channel: m.channel as never,
              status: m.status as never,
            }))
          : existing?.marketplace ?? [
              { channel: "website", status: "LISTED" },
              { channel: "vinted", status: "NOT_LISTED" },
              { channel: "depop", status: "NOT_LISTED" },
              { channel: "ebay", status: "NOT_LISTED" },
            ],
        isPick: Boolean(product.isPick),
        featured: Boolean(product.featured),
      };

      upsertProduct(
        full,
        "Henry",
        existing ? `${sku} updated` : `${sku} created`
      );
      return Response.json({ ok: true, sku: full.sku, slug: full.slug });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
