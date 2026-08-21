import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Badge, SectionHeading } from "@/components/ui";
import { ProductGallery } from "@/components/product-gallery";
import { AddToBag } from "@/components/add-to-bag";
import { WishlistButton } from "@/components/wishlist-button";
import { Accordion } from "@/components/accordion";
import { ProductGrid } from "@/components/product-grid";
import { getSimilar } from "@/lib/catalog";
import { getProductBySlug } from "@/lib/server/store";
import { SITE_URL } from "@/lib/site";
import {
  conditionLabel,
  conditionTone,
  formatPrice,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.name} - Size ${product.size}`,
    description: `${product.brand} ${product.name} in ${product.colour}. Condition: ${conditionLabel(product.condition)}. Pre-owned and checked at Vicarious Clothing.`,
    openGraph: {
      title: `${product.brand} ${product.name}`,
      description: `£${product.price.toFixed(2)} · Size ${product.size} · ${conditionLabel(product.condition)}`,
      images: product.images[0]?.src ? [{ url: product.images[0].src }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const sold = product.status === "SOLD";
  const similar = await getSimilar(product, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    sku: product.sku,
    image: product.images.map((i) => i.src),
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    itemCondition: "https://schema.org/UsedCondition",
    offers: sold
      ? { "@type": "Offer", availability: "https://schema.org/SoldOut", price: product.price, priceCurrency: "GBP", url: `${SITE_URL}/product/${product.slug}` }
      : { "@type": "Offer", availability: "https://schema.org/InStock", price: product.price, priceCurrency: "GBP", url: `${SITE_URL}/product/${product.slug}` },
  };

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          <li>
            <Link href="/shop" className="hover:text-accent-deep">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/shop/${product.category}`} className="hover:text-accent-deep">
              {product.category}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink">{product.brand}</li>
        </ol>
      </nav>

      {sold && (
        <div className="mb-8 border border-ink bg-ink p-5 text-paper sm:p-6">
          <p className="font-display text-lg font-semibold uppercase tracking-tight sm:text-xl">
            Someone got there first.
          </p>
          <p className="mt-1 text-sm text-paper/75">
            This piece has just sold. Similar pieces are still available below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <ProductGallery images={product.images} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">
            {product.brand}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold uppercase leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="font-mono text-2xl">{formatPrice(product.price)}</p>
            {product.compareAtPrice && !sold && (
              <p className="font-mono text-sm text-ink-faint line-through">
                {formatPrice(product.compareAtPrice)}
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-2 font-mono text-[11px] uppercase tracking-[0.16em]">
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <dt className="text-ink-faint">Size</dt>
              <dd className="font-semibold">{product.size}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <dt className="text-ink-faint">Condition</dt>
              <dd>
                <Badge tone="neutral" className={conditionTone(product.condition)}>
                  {conditionLabel(product.condition).toUpperCase()}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <dt className="text-ink-faint">Colour</dt>
              <dd>{product.colour}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-line py-2.5">
              <dt className="text-ink-faint">SKU</dt>
              <dd>{product.sku}</dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center gap-3">
            {sold ? (
              <p className="flex h-14 w-full items-center justify-center border border-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                This one&apos;s gone
              </p>
            ) : product.status === "RESERVED" ? (
              <p className="flex h-14 w-full items-center justify-center border border-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-ink">
                Reserved — checking out now
              </p>
            ) : (
              <AddToBag sku={product.sku} />
            )}
            {!sold && <WishlistButton sku={product.sku} className="h-14 w-14 shrink-0 border border-ink" />}
          </div>

          {!sold && (
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              One of one — when it&apos;s gone, it&apos;s gone
            </p>
          )}

          <div className="mt-8">
            <Accordion
              defaultOpen={sold ? 1 : 0}
              items={[
                {
                  title: "Description",
                  content: (
                    <div className="space-y-3">
                      <p>{product.description}</p>
                      {product.defects.length > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                            Known defects
                          </p>
                          <ul className="mt-2 list-inside list-disc space-y-1">
                            {product.defects.map((d) => (
                              <li key={d}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Condition",
                  content: (
                    <div className="space-y-3">
                      <p>
                        <span className="font-semibold text-ink">
                          {conditionLabel(product.condition)}:
                        </span>{" "}
                        {product.conditionNotes}
                      </p>
                      <p>
                        Every known defect is photographed and listed. Read the{" "}
                        <Link
                          href="/help/condition-guide"
                          className="text-accent-deep underline underline-offset-2"
                        >
                          full condition guide
                        </Link>{" "}
                        to see what each grade means.
                      </p>
                    </div>
                  ),
                },
                {
                  title: "Measurements",
                  content: product.measurements.length ? (
                    <dl className="divide-y divide-line">
                      {product.measurements.map((m) => (
                        <div
                          key={m.label}
                          className="flex justify-between py-2 font-mono text-xs"
                        >
                          <dt className="text-ink-soft">{m.label}</dt>
                          <dd>{m.value}</dd>
                        </div>
                      ))}
                      <p className="pt-3 text-xs text-ink-faint">
                        Measured laid flat by hand. Compare with a piece that
                        fits you well — sizing varies between eras and brands.
                      </p>
                    </dl>
                  ) : (
                    <p>One size fits most.</p>
                  ),
                },
                {
                  title: "Product details",
                  content: (
                    <dl className="divide-y divide-line font-mono text-xs">
                      {[
                        ["Brand", product.brand],
                        ["Size", product.size],
                        ["Colour", product.colour],
                        ["Material", product.material],
                        ["SKU", product.sku],
                        ["Category", product.category],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2">
                          <dt className="text-ink-soft uppercase tracking-[0.12em]">
                            {k}
                          </dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                {
                  title: "Delivery & returns",
                  content: (
                    <div className="space-y-3">
                      <p>
                        UK standard delivery £3.95, free over £75. Dispatched
                        within 2 working days, tracked.
                      </p>
                      <p>
                        14-day returns on everything. Read the{" "}
                        <Link
                          href="/help/returns"
                          className="text-accent-deep underline underline-offset-2"
                        >
                          returns policy
                        </Link>{" "}
                        for the details.
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <section className="mt-20">
        <SectionHeading
          eyebrow={sold ? "While it lasted" : "You might also like"}
          title={sold ? "Similar pieces still here" : "More like this"}
          link="/shop"
        />
        <ProductGrid products={similar} />
      </section>
    </Container>
  );
}
