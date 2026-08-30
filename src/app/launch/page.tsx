import type { Metadata } from "next";
import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";
import { LaunchCountdown } from "@/components/launch-countdown";

export const metadata: Metadata = {
  title: "Launching Soon | Vicarious Clothing",
  description: "Vicarious Clothing launches Wednesday at midday.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LaunchPage() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-ink text-paper">
      <Image
        src="/images/Hero.jpg"
        alt="Vicarious Clothing launch preview"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/50" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <section className="mx-auto w-full max-w-3xl text-center">
          <BrandMark size={72} className="mx-auto mb-8 h-16 w-16 text-paper" />

          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-paper/70">
            Vicarious Clothing
          </p>

          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Launching
            <br />
            Soon
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">
            The shop is being kept closed while we get everything ready. Vicarious Clothing opens at midday on Wednesday.
          </p>

          <div className="mt-10">
            <LaunchCountdown />
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
            New lives. Same clothes.
          </p>
        </section>
      </main>
    </div>
  );
}
