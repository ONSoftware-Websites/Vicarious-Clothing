import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketplaceCell } from "@/components/admin/marketplace-cell";
import { listProducts } from "@/lib/server/store";
import { formatPrice } from "@/lib/utils";
import { MARKETPLACES, type Marketplace } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  const products = listProducts().filter((p) => p.status !== "DRAFT");

  const counts = MARKETPLACES.map((channel: Marketplace) => ({
    channel,
    listed: products.filter(
      (p) =>
        p.status !== "SOLD" &&
        p.marketplace.find((m) => m.channel === channel)?.status === "LISTED"
    ).length,
  }));

  const listedElsewhere = products.filter(
    (p) =>
      p.status !== "SOLD" &&
      p.marketplace.some(
        (m) => m.channel !== "website" && m.status === "LISTED"
      )
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Marketplace
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          The manual status layer for multi-channel selling. If a piece sells
          elsewhere, mark it sold here and the website delists it immediately
          — master inventory is always the source of truth.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {counts.map((c) => (
          <div key={c.channel} className="border border-line bg-cream p-5">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
              {c.channel}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">
              {c.listed}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              listed
            </p>
          </div>
        ))}
      </div>

      {listedElsewhere.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 p-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-amber-900">
            {listedElsewhere.length} piece{listedElsewhere.length === 1 ? "" : "s"} listed on other platforms
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            Remember to mark them sold here the moment they go — the website
            checks availability at checkout, so this is the safety net.
          </p>
        </div>
      )}

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">SKU</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Product</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Price</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Channels</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={p.images[0]?.src ?? ""}
                      alt=""
                      width={40}
                      height={50}
                      className="h-[50px] w-10 object-cover"
                    />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        {p.brand}
                      </p>
                      <Link
                        href={`/product/${p.slug}`}
                        className="font-display text-sm font-medium hover:text-accent-deep"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatPrice(p.price)}</td>
                <td className="px-4 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  {p.status}
                </td>
                <td className="px-4 py-4">
                  <MarketplaceCell product={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
