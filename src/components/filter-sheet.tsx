"use client";

import { Suspense, useState } from "react";
import { Filters, type Facets } from "@/components/filters";

export function FilterSheet({ facets }: { facets: Facets }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden w-56 shrink-0 lg:block">
        <Suspense fallback={null}>
          <Filters facets={facets} idPrefix="desktop-filters" />
        </Suspense>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center justify-center gap-2 border border-ink px-5 font-display text-[11px] font-medium uppercase tracking-[0.16em] lg:hidden"
      >
        Filter
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute left-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-accent-deep"
              >
                Close
              </button>
            </div>
            <Suspense fallback={null}>
              <Filters facets={facets} onApply={() => setOpen(false)} idPrefix="mobile-filters" />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
