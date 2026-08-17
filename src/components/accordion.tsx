"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: Array<{ title: string; content: ReactNode }>;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <div key={item.title} className="border-b border-line">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between py-4 text-left"
          >
            <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
              {item.title}
            </span>
            <span
              className={cn(
                "font-mono text-sm text-ink-faint transition-transform duration-200",
                open === i && "rotate-45"
              )}
              aria-hidden
            >
              +
            </span>
          </button>
          <div
            className={cn(
              "grid transition-all duration-200",
              open === i ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="text-sm leading-relaxed text-ink-soft">
                {item.content}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
