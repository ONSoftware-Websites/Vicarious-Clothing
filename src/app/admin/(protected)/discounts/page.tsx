import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DiscountForm, DiscountRow } from "@/components/admin/discount-form";
import { listDiscounts } from "@/lib/server/store";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  if (!(await requireRole("ADMIN"))) redirect("/admin");
  const discounts = await listDiscounts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Discounts
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Percentage, fixed-value, free-delivery and category-specific codes.
          Minimum baskets, expiry dates and usage limits are enforced at
          checkout. Keep these occasional — nobody should expect a permanent
          code.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ["Total codes",String(discounts.length)],
        ["Expired",String(discounts.filter(d=>d.expiresAt&&new Date(d.expiresAt).getTime()<Date.now()).length)],
        ["Usage exhausted",String(discounts.filter(d=>d.usageLimit!==undefined&&d.usedCount>=d.usageLimit).length)],
        ["Total redemptions",String(discounts.reduce((sum,d)=>sum+d.usedCount,0))]
      ].map(([name,value])=><div key={name} className="border border-line bg-cream p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{name}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></div>)}</div>
      <details className="border border-line"><summary className="cursor-pointer bg-cream p-5 font-display text-xs font-semibold uppercase tracking-widest">+ Create discount code</summary><div className="p-5"><DiscountForm /></div></details>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Code</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Type</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Value</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Rules</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Used</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Expires</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4 font-mono text-xs font-semibold">{d.code}</td>
                <td className="px-4 py-4 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  {d.type.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-4 font-mono text-xs">
                  {d.type === "free_delivery" ? "—" : d.type === "percentage" ? `${d.value}%` : `£${d.value.toFixed(2)}`}
                </td>
                <td className="px-4 py-4 text-xs text-ink-soft">
                  {[
                    d.minBasket !== undefined && `min £${d.minBasket}`,
                    d.categories?.length && `only ${d.categories.join(", ")}`,
                    d.usageLimit !== undefined && `limit ${d.usageLimit}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-4 py-4 font-mono text-xs">
                  {d.usedCount}
                  {d.usageLimit !== undefined && ` / ${d.usageLimit}`}
                </td>
                <td className="px-4 py-4 font-mono text-xs">
                  {d.expiresAt ? formatDate(d.expiresAt) : "—"}
                </td>
                <td className="px-4 py-4">
                  <DiscountRow discount={d} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
