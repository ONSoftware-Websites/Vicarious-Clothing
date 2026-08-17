import type { Metadata } from "next";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent-deep">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold uppercase tracking-tight sm:text-6xl">
        Wrong turn.
      </h1>
      <p className="mt-4 max-w-sm text-ink-soft">
        Nothing&apos;s hanging here. The page you&apos;re after has moved,
        sold or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/shop">Browse everything</Button>
        <Button href="/" variant="outline">
          Back home
        </Button>
      </div>
    </div>
  );
}
