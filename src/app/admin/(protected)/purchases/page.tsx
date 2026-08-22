import type { Metadata } from "next";
import { PurchaseActions } from "@/components/admin/purchase-actions";
import { PurchaseDeleteButton } from "@/components/admin/purchase-delete-button";
import { PurchaseForm } from "@/components/admin/purchase-form";
import { listPurchases } from "@/lib/server/store";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stock Purchases" };

export default async function PurchasesPage() {
  const purchases = await listPurchases();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Stock purchases
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          The acquisition side of the ledger — who you bought from, what you
          agreed, and whether they&apos;ve been paid. Sell-to-us leads that get
          accepted appear here automatically.
        </p>
      </div>

      <PurchaseForm />

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Seller</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Items</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Amount</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Notes</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Date</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4">
                  <p className="font-medium">{p.sellerName}</p>
                  {p.sellerEmail && (
                    <p className="font-mono text-[10px] text-ink-faint">{p.sellerEmail}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  {p.items.length ? (
                    <ul className="space-y-1">
                      {p.items.map((i) => (
                        <li key={i.sku} className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                          {i.sku} {i.name} — {formatPrice(i.cost)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      Items not yet linked
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatPrice(p.amount)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className={
                        p.status === "PAID"
                          ? "inline-flex w-fit border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                          : "inline-flex w-fit border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-800"
                      }
                    >
                      {p.status}
                    </span>
                    <PurchaseActions id={p.id} paid={p.status === "PAID"} />
                  </div>
                </td>
                <td className="max-w-xs px-4 py-4 text-xs leading-relaxed text-ink-soft">
                  {p.notes ?? "—"}
                </td>
                <td className="px-4 py-4 font-mono text-xs whitespace-nowrap">
                  {formatDate(p.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <PurchaseDeleteButton id={p.id} />
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No purchases recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
