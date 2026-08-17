"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MarketplaceListing, Product } from "@/lib/types";

export function MarketplaceCell({ product }: { product: Product }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sku: product.sku }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const listingFor = (channel: string): MarketplaceListing | undefined =>
    product.marketplace.find((m) => m.channel === channel);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["website", "vinted", "depop", "ebay"] as const).map((channel) => {
        const entry = listingFor(channel);
        const listed = entry?.status === "LISTED";
        return (
          <button
            key={channel}
            type="button"
            disabled={busy || (channel !== "website" && product.status === "SOLD")}
            onClick={() =>
              run({
                action: "marketplace",
                channel,
                status: listed ? "NOT_LISTED" : "LISTED",
              })
            }
            className={
              listed
                ? "border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-800 hover:border-emerald-400 disabled:opacity-50"
                : "border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint hover:border-ink disabled:opacity-50"
            }
            title={`Toggle ${channel}`}
          >
            {channel} {listed ? "✓" : "—"}
          </button>
        );
      })}
      {product.status !== "SOLD" && (
        <div className="mt-1 flex w-full gap-2">
          {(["vinted", "depop", "ebay"] as const).map((channel) => (
            <button
              key={channel}
              type="button"
              disabled={busy}
              onClick={() =>
                run({ action: "sold_elsewhere", channel })
              }
              className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
            >
              Sold on {channel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
