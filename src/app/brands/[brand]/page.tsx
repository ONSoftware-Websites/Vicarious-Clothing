import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { listProducts } from "@/lib/server/store";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const product = (await listProducts()).find(
    (p) => slugify(p.brand) === brand && p.status !== "DRAFT"
  );
  if (!product) return {};
  return {
    title: `${product.brand}`,
    description: `Pre-owned ${product.brand} at Vicarious Clothing — every piece measured, checked and photographed.`,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const products = (await listProducts())
    .filter((p) => p.status !== "DRAFT")
    .filter((p) => slugify(p.brand) === brand);

  if (products.length === 0) notFound();
  const name = products[0].brand;
  const available = products.filter((p) => p.status === "AVAILABLE");

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
            Brand
          </p>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-5xl">
            {name}
          </h1>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          {available.length} available · {products.length} total
        </p>
      </div>
      <ProductGrid
        products={available.length ? available : products}
        showSoldOverlay
      />
    </Container>
  );
}
