import type { NextRequest } from "next/server";
import type { Product } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { adminDeleteProduct } from "@/lib/server/admin-delete";
import { setSellerHqPrdCode } from "@/lib/server/sellerhq-prd-code";
import {
  duplicateProduct,
  getProductBySku,
  nextSku,
  setProductStatus,
  upsertProduct,
} from "@/lib/server/store";
import { slugify } from "@/lib/utils";

const VALID_STATUSES: Product["status"][] = ["AVAILABLE", "SOLD", "ARCHIVED", "DRAFT"];

function isPositiveMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function optionalMoney(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : undefined;
}

function optionalText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  const actor = "Admin";

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "delete") {
      await adminDeleteProduct(String(body.sku), actor);
      return Response.json({ ok: true });
    }

    if (action === "duplicate") {
      const copy = await duplicateProduct(String(body.sku), actor);
      if (!copy) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ ok: true, sku: copy.sku });
    }

    if (action === "status") {
      const status = String(body.status);
      if (!VALID_STATUSES.includes(status as Product["status"])) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      await setProductStatus(String(body.sku), status as Product["status"]);
      return Response.json({ ok: true });
    }

    if (action === "discount") {
      const sku = String(body.sku);
      const newPrice = Number(body.price);
      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        return Response.json({ error: "Enter a valid sale price" }, { status: 400 });
      }
      const product = await getProductBySku(sku);
      if (!product) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Product = {
        ...product,
        compareAtPrice: product.compareAtPrice ?? product.price,
        price: Math.round(newPrice * 100) / 100,
      };
      await upsertProduct(
        updated,
        actor,
        `${sku} discounted to £${updated.price.toFixed(2)}`
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
      const product = await getProductBySku(sku);
      if (!product) return Response.json({ error: "Not found" }, { status: 404 });
      const updated: Product = {
        ...product,
        marketplace: product.marketplace.map((m) =>
          m.channel === channel ? { ...m, status: status as never } : m
        ),
      };
      await upsertProduct(
        updated,
        actor,
        `${sku} ${channel}: ${status}`
      );
      return Response.json({ ok: true });
    }

    if (action === "sold_elsewhere") {
      const sku = String(body.sku);
      const channel = String(body.channel);
      const product = await getProductBySku(sku);
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
      await upsertProduct(
        updated,
        actor,
        `${sku} sold on ${channel} — website delisted`
      );
      return Response.json({ ok: true });
    }

    if (action === "save") {
      const product = body.product as Partial<Product>;
      if (!product.name || !product.brand || !product.category || !product.condition) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      if (!String(product.size ?? "").trim()) {
        return Response.json({ error: "Size is required" }, { status: 400 });
      }
      if (!isPositiveMoney(product.price)) {
        return Response.json({ error: "Price must be greater than £0" }, { status: 400 });
      }
      const compareAtPrice = optionalMoney(product.compareAtPrice);
      if (compareAtPrice !== undefined && compareAtPrice <= Number(product.price)) {
        return Response.json({ error: "Compare-at price must be higher than the sale price" }, { status: 400 });
      }
      if (
        product.status === "AVAILABLE" &&
        (!Array.isArray(product.images) || product.images.filter((image) => image.src).length === 0)
      ) {
        return Response.json({ error: "Available products need at least one image" }, { status: 400 });
      }

      const existing = product.sku ? await getProductBySku(product.sku) : undefined;
      const sku = existing ? existing.sku : await nextSku();
      const slug = existing
        ? existing.slug
        : `${sku.toLowerCase()}-${slugify(product.brand)}-${slugify(product.name)}`;

      const full: Product = {
        sku,
        slug,
        name: String(product.name).trim(),
        brand: String(product.brand).trim(),
        category: product.category as Product["category"],
        size: String(product.size ?? "").trim(),
        colour: String(product.colour ?? "").trim(),
        material: String(product.material ?? "").trim(),
        condition: product.condition as Product["condition"],
        conditionNotes: String(product.conditionNotes ?? "").trim(),
        measurements: Array.isArray(product.measurements)
          ? product.measurements
              .filter((m: { label?: string; value?: string }) => m.label && m.value)
              .map((m: { label: string; value: string }) => ({
                label: String(m.label).trim(),
                value: String(m.value).trim(),
              }))
          : [],
        description: String(product.description ?? "").trim(),
        defects: Array.isArray(product.defects)
          ? product.defects.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
          : [],
        tags: Array.isArray(product.tags)
          ? product.tags.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
          : [],
        price: Math.round(Number(product.price ?? 0) * 100) / 100,
        compareAtPrice,
        cost: optionalMoney(product.cost),
        floorPrice: optionalMoney(product.floorPrice),
        images: Array.isArray(product.images) && product.images.length
          ? product.images
              .filter((i: { src?: string }) => i.src)
              .map((i: { src?: string; alt?: string }, idx: number) => ({
                src: String(i.src ?? "").trim(),
                alt: i.alt || `${product.brand} ${product.name} - image ${idx + 1}`,
              }))
          : existing?.images ?? [],
        status: (product.status as Product["status"]) ?? "DRAFT",
        location: product.location ? String(product.location).trim() : undefined,
        listedAt:
          product.status === "AVAILABLE" && !existing?.listedAt
            ? new Date().toISOString()
            : existing?.listedAt ?? new Date().toISOString(),
        soldAt: existing?.soldAt,
        reservedUntil: existing?.reservedUntil,
        acquisitionSource: product.acquisitionSource
          ? String(product.acquisitionSource).trim()
          : undefined,
        purchaseDate: product.purchaseDate
          ? String(product.purchaseDate).trim()
          : undefined,
        prdCode: optionalText(product.prdCode),
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

      if (!VALID_STATUSES.includes(full.status)) {
        return Response.json({ error: "Invalid product status" }, { status: 400 });
      }

      await upsertProduct(
        full,
        actor,
        existing ? `${sku} updated` : `${sku} created`
      );
      await setSellerHqPrdCode(full.sku, full.prdCode);
      return Response.json({ ok: true, sku: full.sku, slug: full.slug });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin product action failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Admin product action failed" },
      { status: 500 }
    );
  }
}
