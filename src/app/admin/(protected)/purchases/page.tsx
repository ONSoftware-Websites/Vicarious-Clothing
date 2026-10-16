import Link from "next/link";
import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PurchaseActions } from "@/components/admin/purchase-actions";
import { PurchaseDeleteButton } from "@/components/admin/purchase-delete-button";
import { PurchaseForm } from "@/components/admin/purchase-form";
import { listPurchases } from "@/lib/server/store";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stock Purchases" };

export default async function PurchasesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!(await requireRole("ADMIN"))) redirect("/admin");
  const allPurchases = await listPurchases();
  const raw = await searchParams;
  const q = typeof raw.q==="string"?raw.q.trim().toLowerCase():"";
  const status = raw.status==="PAID"||raw.status==="UNPAID"?raw.status:"";
  const purchases = allPurchases.filter(p=>(!status||(status==="PAID"?p.status==="PAID":p.status!=="PAID"))&&(!q||[p.sellerName,p.sellerEmail??"",p.notes??"",...p.items.map(i=>`${i.sku} ${i.name}`)].join(" ").toLowerCase().includes(q)));
  const paid = allPurchases.filter(p=>p.status==="PAID");
  const outstanding = allPurchases.filter(p=>p.status!=="PAID");
  const unlinked = allPurchases.filter(p=>p.items.length===0);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Workspace / Acquisitions</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Stock purchases
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          The acquisition side of the ledger — who you bought from, what you
          agreed, and whether they&apos;ve been paid. Sell-to-us leads that get
          accepted appear here automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        ["Total acquisitions",String(allPurchases.length),"All recorded purchases"],
        ["Paid",String(paid.length),formatPrice(paid.reduce((sum,p)=>sum+p.amount,0))+" paid"],
        ["Outstanding",String(outstanding.length),formatPrice(outstanding.reduce((sum,p)=>sum+p.amount,0))+" to reconcile"],
        ["Unlinked stock",String(unlinked.length),"Purchases without linked items"]
      ].map(([label,value,detail])=><div key={label} className="border border-line bg-cream p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-ink-soft">{detail}</p></div>)}</div>

      <details className="border border-line bg-paper" id="record-purchase"><summary className="cursor-pointer bg-cream px-5 py-4 font-display text-xs font-semibold uppercase tracking-wider">+ Record a stock purchase</summary><div className="p-5"><PurchaseForm /></div></details>

      <form action="/admin/purchases" className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="purchase-search">Search purchases</label>
        <input id="purchase-search" name="q" defaultValue={typeof raw.q==="string"?raw.q:""} placeholder="Seller, email, item SKU or notes…" className="h-11 min-w-0 flex-1 border border-line bg-paper px-4 text-sm sm:max-w-md"/>
        <label className="sr-only" htmlFor="purchase-status">Payment status</label>
        <select id="purchase-status" name="status" defaultValue={status} className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase"><option value="">All payments</option><option value="UNPAID">Outstanding</option><option value="PAID">Paid</option></select>
        <button type="submit" className="h-11 bg-ink px-5 font-display text-xs font-semibold uppercase tracking-wider text-paper">Apply</button>
        <Link href="/admin/purchases" className="flex h-11 items-center font-mono text-xs uppercase text-ink-soft underline underline-offset-4">Clear</Link>
      </form>

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
                  No purchases match these filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
