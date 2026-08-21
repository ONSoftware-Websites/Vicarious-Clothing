import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { listProducts } from "@/lib/server/store";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "The brands we keep going back to at Vicarious Clothing — Carhartt, Nike, Stussy, Levi's, Patagonia and more, all pre-owned and checked.",
};

export default async function BrandsPage() {
  const products = (await listProducts()).filter((p) => p.status !== "DRAFT");
  const brands = new Map<string, number>();
  for (const p of products) {
    brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1);
  }
  const sorted = [...brands.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10 border-b border-line pb-8">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Brands
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Every brand here has earned its place. Browse what we currently have
          in stock.
        </p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {sorted.map(([brand, count]) => (
          <li key={brand}>
            <Link
              href={`/brands/${slugify(brand)}`}
              className="group flex items-center justify-between py-5 transition-colors"
            >
              <span className="font-display text-xl font-medium uppercase tracking-tight transition-colors group-hover:text-accent-deep sm:text-2xl">
                {brand}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                {count} {count === 1 ? "piece" : "pieces"} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
