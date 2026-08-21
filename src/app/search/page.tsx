import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { filterProducts } from "@/lib/catalog";
import { listProducts } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Vicarious Clothing catalogue.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";

  const products = (await listProducts()).filter((p) => p.status !== "DRAFT");
  const results = q
    ? filterProducts(products, { q, onlyAvailable: false }, "newest")
    : [];

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10 border-b border-line pb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          Search
        </p>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          {q ? `"${q}"` : "What are you looking for?"}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          {q && `${results.length} ${results.length === 1 ? "result" : "results"}`}
        </p>
      </div>

      {q && results.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-display text-2xl font-semibold uppercase">
            Nothing matched that.
          </p>
          <p className="mt-2 text-ink-soft">
            Try another search or browse everything.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block border border-ink px-8 py-3.5 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
          >
            Browse everything
          </Link>
        </div>
      )}

      <ProductGrid products={results} showSoldOverlay />
    </Container>
  );
}
