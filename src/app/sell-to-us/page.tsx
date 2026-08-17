import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { SellToUsForm } from "@/components/sell-to-us-form";

export const metadata: Metadata = {
  title: "Sell To Us",
  description:
    "Selling your clothes to Vicarious. Tell us what you've got — brand, type, size and condition — and we'll come back with an offer.",
};

export default function SellToUsPage() {
  return (
    <div>
      <section className="border-b border-line bg-ink py-16 text-paper sm:py-24">
        <Container>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
            Sell to us
          </p>
          <h1 className="font-display text-4xl font-semibold uppercase leading-tight tracking-tight sm:text-6xl">
            Your wardrobe.
            <br />
            Our next drop.
          </h1>
          <p className="mt-5 max-w-lg text-paper/70">
            Got good pieces that deserve another outing? Tell us what
            you&apos;re selling and we&apos;ll get back to you with an offer —
            usually within a couple of working days.
          </p>
        </Container>
      </section>

      <Container className="grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-tight">
              What we&apos;re looking for
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-soft">
              <li>· Menswear and unisex streetwear</li>
              <li>· Carhartt, Nike, Stussy, Levi&apos;s, Patagonia and similar</li>
              <li>· Vintage pieces from the 90s and 00s</li>
              <li>· Trainers with life left in them</li>
              <li>· Anything with an honest story</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold uppercase tracking-tight">
              How it works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                "Send us details and a few photos.",
                "We review and make an offer.",
                "Post it to us — we cover postage on accepted items.",
                "We inspect, confirm and pay you.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4 text-sm leading-relaxed text-ink-soft">
                  <span className="font-mono text-xs text-accent-deep">
                    0{i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="border border-line bg-cream p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Questions first?
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Email{" "}
              <a
                href="mailto:hello@vicariousclothing.co.uk"
                className="text-accent-deep underline underline-offset-2"
              >
                hello@vicariousclothing.co.uk
              </a>{" "}
              with a couple of photos and we&apos;ll tell you straight away if
              it&apos;s for us.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-6 font-display text-lg font-semibold uppercase tracking-tight">
            Tell us what you&apos;ve got
          </h2>
          <SellToUsForm />
        </div>
      </Container>
    </div>
  );
}
