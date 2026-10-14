import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Scheduled Maintenance | Vicarious Clothing",
  description: "Vicarious Clothing is temporarily closed for scheduled improvements. We'll be back soon.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-ink text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(ellipse at 50% 25%, #0097af 0%, transparent 55%)" }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <BrandMark size={72} className="mb-10 h-16 w-16 text-paper" />
          <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-accent">
            Vicarious Clothing / Site update
          </p>
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.96] tracking-tight sm:text-7xl lg:text-8xl">
            GOOD THINGS<br />TAKE TIME.
          </h1>
          <div className="my-8 h-px w-20 bg-accent" />
          <h2 className="font-display text-xl font-semibold uppercase tracking-[0.06em] sm:text-2xl">
            Scheduled maintenance
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-paper/75 sm:text-lg">
            We’re making some improvements behind the scenes to give you a better Vicarious experience.
            The shop is temporarily closed while we work, but we’ll be back soon.
          </p>
          <p className="mt-5 text-sm text-paper/60">
            Already placed an order? We’re still here to help.
          </p>
          <a href="mailto:support@vicariousclothing.co.uk"
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-paper/40 px-8 font-display text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            Contact support
          </a>
          <div className="mt-16 border-t border-paper/15 pt-6 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-paper/45">
            New lives. Same clothes.
          </div>
        </section>
      </main>
    </div>
  );
}
