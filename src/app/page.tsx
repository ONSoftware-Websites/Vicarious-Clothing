import Image from "next/image";
import Link from "next/link";
import { Button, Container, SectionHeading } from "@/components/ui";
import { ProductGrid } from "@/components/product-grid";
import { NewsletterForm } from "@/components/newsletter-form";
import { getNewIn, getPicks, getRecentlySold } from "@/lib/catalog";
import { listProducts } from "@/lib/server/store";
import { CATEGORY_LABELS, SHOP_CATEGORIES } from "@/lib/site";
import { seedImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listProducts();
  const newIn = getNewIn(products, 8);
  const picks = getPicks(products, 4);
  const recentlySold = getRecentlySold(products, 6);

  return (
    <div>
      <section className="relative flex min-h-[82vh] items-end overflow-hidden bg-ink">
        <Image
          src="/images/hero.jpg"
          alt="Vicarious Clothing campaign"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <Container className="relative z-10 pb-16 pt-40 sm:pb-24">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-paper/80">
            Curated clothing, ready to go again
          </p>
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-paper sm:text-7xl lg:text-8xl">
            New lives.
            <br />
            Same clothes.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop/new-in" size="lg" variant="inverse">
              Shop new in →
            </Button>
            <Button href="/sell-to-us" size="lg" variant="outline" className="border-paper text-paper hover:bg-paper hover:text-ink">
              Sell to us
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Just landed"
            title="New In"
            link="/shop/new-in"
          />
          {newIn.length ? (
            <ProductGrid products={newIn} />
          ) : (
            <div className="py-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-faint">Fresh stock coming</p>
              <p className="mt-2 font-display text-lg font-medium uppercase">New pieces land weekly — check back soon.</p>
              <Link href="/shop" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2">Browse everything →</Link>
            </div>
          )}
        </Container>
      </section>

      <section className="bg-ink py-16 text-paper sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Editorial"
            title="Vicarious Picks"
            link="/shop?collection=picks"
            linkLabel="Shop the edit"
            className="[&_h2]:text-paper"
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {picks.slice(0, 2).map((pick) => (
              <Link
                key={pick.sku}
                href={`/product/${pick.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={pick.images[1]?.src ?? pick.images[0]?.src ?? ""}
                    alt={pick.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="absolute left-4 top-4 border border-paper/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper">
                    Vicarious Pick
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">
                      {pick.brand}
                    </p>
                    <h3 className="font-display text-lg font-medium">
                      {pick.name}
                    </h3>
                  </div>
                  <p className="font-mono text-sm text-paper/90">
                    £{pick.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-12">
            {picks.map((pick) => (
              <Link
                key={pick.sku}
                href={`/product/${pick.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={pick.images[0]?.src ?? ""}
                    alt={pick.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-opacity duration-300 group-hover:opacity-70"
                  />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">
                  {pick.brand}
                </p>
                <p className="font-display text-sm font-medium">{pick.name}</p>
                <p className="mt-1 font-mono text-xs text-paper/80">
                  £{pick.price.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Browse" title="Shop by category" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {SHOP_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/shop/${cat}`}
                className="group relative block overflow-hidden"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-cream sm:aspect-square">
                  <Image
                    src={`/images/categories/${cat}.jpg`}
                    alt={CATEGORY_LABELS[cat]}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/20" />
                  <span className="absolute bottom-4 left-4 border border-paper/70 bg-ink/40 px-3 py-1.5 font-display text-xs font-medium uppercase tracking-[0.16em] text-paper backdrop-blur-sm">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-cream py-16 sm:py-24">
        <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
            <Image
              src="/images/story.jpg"
              alt="Inside the Vicarious studio"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
              Why Vicarious
            </p>
            <h2 className="font-display text-3xl font-semibold uppercase leading-tight tracking-tight sm:text-4xl">
              The good stuff, going round again
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">
              Vicarious Clothing is an independent, pre-owned menswear and
              streetwear store. Every piece is sourced by hand, checked against
              our condition scale and measured properly — so what you see is
              exactly what arrives.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
              No mystery boxes, no machine-generated listings. Just good
              clothing given another life.
            </p>
            <div className="mt-8">
              <Button href="/about">Read our story</Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Gone already"
            title="Missed these?"
            link="/shop"
            linkLabel="What's still here"
          />
          <ProductGrid products={recentlySold} showSoldOverlay />
        </Container>
      </section>

      <section className="bg-ink py-16 text-paper sm:py-24">
        <Container className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
            Newsletter
          </p>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-5xl">
            Get there first.
          </h2>
          <p className="mt-4 text-paper/70">
            New pieces don&apos;t tend to stay around.
          </p>
          <NewsletterForm />
        </Container>
      </section>
    </div>
  );
}
