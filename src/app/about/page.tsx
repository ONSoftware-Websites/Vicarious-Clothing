import type { Metadata } from "next";
import Image from "next/image";
import { Button, Container } from "@/components/ui";
import { seedImage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Vicarious Clothing is an independent UK retailer of pre-owned menswear and streetwear. Every piece is hand-picked, measured and checked.",
};

export default function AboutPage() {
  return (
    <div>
      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
              About
            </p>
            <h1 className="font-display text-4xl font-semibold uppercase leading-tight tracking-tight sm:text-5xl">
              Good clothes deserve more than one life
            </h1>
            <div className="mt-8 space-y-5 leading-relaxed text-ink-soft">
              <p>
                Vicarious Clothing started with a simple frustration: the best
                clothing on the internet was scattered across faceless
                marketplaces, with photos taken on bedroom floors and
                descriptions that said almost nothing.
              </p>
              <p>
                We wanted a store that treated pre-owned clothing the way it
                deserves — hand-picked pieces, honest condition grading, real
                measurements, and photography you can actually shop from.
              </p>
              <p>
                Every piece that makes it onto the site is checked against our
                six-grade condition scale, measured by hand and photographed
                properly. If something has a mark, you&apos;ll see it before
                you buy it.
              </p>
              <p>
                Most of what we sell is one of one. When a piece goes, it goes
                — which is exactly how a good second-hand store should feel.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/shop">Shop the collection</Button>
              <Button href="/sell-to-us" variant="outline">
                Sell to us
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={seedImage("vc-about", 1000, 1250)}
              alt="The Vicarious Clothing studio"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>

      <section className="border-y border-line bg-cream py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:gap-16">
            {[
              {
                title: "Picked by hand",
                body: "No bulk job lots, no mystery stock. Every piece is chosen because we'd wear it ourselves.",
              },
              {
                title: "Graded honestly",
                body: "A six-grade condition scale, with every known defect photographed and written down.",
              },
              {
                title: "Measured properly",
                body: "Category-specific measurements on every listing, taken by hand, so you know how it fits.",
              },
            ].map((item) => (
              <div key={item.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">
                  0{item.title.length}
                </p>
                <h2 className="mt-3 font-display text-xl font-semibold uppercase tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
