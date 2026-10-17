import {redirect} from "next/navigation";
import Link from "next/link";
import {requireRole} from "@/lib/server/admin-auth";
import {getFinanceEntries} from "@/lib/server/finance-data";
import {listOrders,listProducts,listPurchases} from "@/lib/server/store";
import {financeReport} from "@/lib/finance-report";
import {formatPrice} from "@/lib/utils";
import {StripeReconcileForm} from "@/components/admin/stripe-reconcile-form";
import {FinanceAdjustmentForm} from "@/components/admin/finance-adjustment-form";

export const dynamic="force-dynamic";
export const metadata={title:"Finance Ledger | Vicarious Clothing"};
function Metric({name,value,note}:{name:string;value:string;note:string}){
 return <div className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">{name}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-ink-soft">{note}</p></div>;
}
export default async function FinancePage(){
 if(!(await requireRole("ADMIN")))redirect("/admin");
 const [orders,products,purchases,entries]=await Promise.all([
  listOrders(),listProducts(),listPurchases(),getFinanceEntries().catch(()=>null)
 ]);
 if(!entries)return <p role="alert" className="p-8">Financial ledger unavailable or reporting limit exceeded. Totals have been withheld.</p>;
 entries.sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)||b.created_at.localeCompare(a.created_at));
 const report=financeReport(orders,products,purchases,entries);
 return <div className="space-y-8">
  <header className="border-b border-line pb-7">
   <p className="font-mono text-[10px] uppercase tracking-widest text-accent-deep">Business / Reconciliation</p>
   <h1 className="mt-2 font-display text-3xl font-bold uppercase">Finance ledger</h1>
   <p className="mt-3 max-w-3xl text-sm text-ink-soft">Record payment fees, returns, postage and operating expenditure. Compare with booked sales and known inventory acquisition costs.</p>
   <div className="mt-5 flex flex-wrap gap-3"><Link href="/admin/analytics" className="border border-line px-4 py-3 font-mono text-xs uppercase">← Analytics</Link><a href="/api/admin/finance/export" className="border border-ink px-4 py-3 font-mono text-xs uppercase">Download CSV</a></div>
  </header>
  {!report.isComplete&&<div role="status" className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
   <strong>Reconciliation incomplete.</strong> {report.unknownCosts} sold line items lack recorded cost; {report.refundedWithoutLedger} fully refunded orders lack a matching refund adjustment. Do not treat contribution as accounting profit.
  </div>}
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   <Metric name="Recorded order totals" value={formatPrice(report.sales)} note={`${report.orders} non-cancelled, non-pending orders`}/>
   <Metric name="Known acquisition costs" value={formatPrice(report.itemCosts)} note={`${report.unknownCosts} item costs missing`}/>
   <Metric name="Recorded adjustments" value={formatPrice(report.expenseTotal)} note="Fees, refunds, shipping and operating expenses"/>
   <Metric name="Estimated contribution" value={formatPrice(report.contribution)} note="Before unrecorded costs, tax and other liabilities"/>
  </div>
  <section className="grid gap-6 lg:grid-cols-2">
   <div className="border border-line p-5"><h2 className="font-display text-sm font-bold uppercase tracking-widest">Adjustment breakdown</h2>
    <dl className="mt-4 space-y-3">{Object.entries(report.adjustments).map(([key,value])=><div key={key} className="flex justify-between border-b border-line pb-2 text-sm"><dt>{key.replaceAll("_"," ")}</dt><dd className="font-mono">{formatPrice(value)}</dd></div>)}</dl>
   </div>
   <div className="border border-line p-5"><h2 className="font-display text-sm font-bold uppercase tracking-widest">Channel performance</h2>
    <div className="mt-4 space-y-4">{report.channels.map(c=><div key={c.channel} className="border-b border-line pb-3">
     <div className="flex justify-between text-sm"><strong className="uppercase">{c.channel}</strong><span className="font-mono">{formatPrice(c.sales)}</span></div>
     <p className="mt-1 text-xs text-ink-soft">{c.orders} orders · {formatPrice(c.recordedAdjustments)} order-linked adjustments</p>
    </div>)}</div>
    <p className="mt-3 text-xs text-ink-soft">Unallocated business expenses are not assigned to channels.</p>
   </div>
  </section>
  <section className="border border-line p-5"><StripeReconcileForm/></section>
  <section className="grid gap-6 lg:grid-cols-2">
   <div className="border border-line p-5"><h2 className="font-display text-sm font-bold uppercase tracking-widest">Monthly trading activity</h2>
    <div className="mt-4 max-h-80 overflow-y-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-ink-soft"><th>Month</th><th>Orders</th><th>Gross orders</th><th>Adjustments</th></tr></thead><tbody>{report.monthly.map(m=><tr key={m.month} className="border-t border-line"><td className="py-3 font-mono">{m.month}</td><td>{m.orders}</td><td>{formatPrice(m.sales)}</td><td>{formatPrice(m.adjustments)}</td></tr>)}</tbody></table></div>
    <p className="mt-3 text-xs text-ink-soft">Order creation months and adjustment transaction months are displayed separately; timing may differ from bank settlement.</p>
   </div>
   <div className="border border-line p-5"><h2 className="font-display text-sm font-bold uppercase tracking-widest">Promotions attribution</h2>
    <div className="mt-4 max-h-80 overflow-y-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-ink-soft"><th>Code</th><th>Orders</th><th>Order totals</th><th>Discounts</th></tr></thead><tbody>{report.promotions.map(p=><tr key={p.code} className="border-t border-line"><td className="py-3 font-mono">{p.code}</td><td>{p.orders}</td><td>{formatPrice(p.orderTotals)}</td><td>{formatPrice(p.discountRecorded)}</td></tr>)}</tbody></table>{!report.promotions.length&&<p className="mt-3 text-sm text-ink-soft">No recorded discount-code orders yet.</p>}</div>
    <p className="mt-3 text-xs text-ink-soft">Attribution is based on checkout discount codes, not proven incremental marketing impact or newsletter clicks.</p>
   </div>
  </section>
  <details className="border border-line"><summary className="cursor-pointer bg-cream p-5 font-display text-xs font-semibold uppercase tracking-widest">+ Record a financial adjustment</summary><div className="p-5"><FinanceAdjustmentForm/></div></details>
  <section><h2 className="mb-4 font-display text-sm font-bold uppercase tracking-widest">Financial records</h2>
   <div className="overflow-x-auto border border-line"><table className="w-full min-w-[850px] text-left text-sm">
    <thead className="bg-cream"><tr>{["Date","Type","Amount","Order","Reference","Notes"].map(h=><th key={h} className="px-4 py-3 font-mono text-[10px] uppercase">{h}</th>)}</tr></thead>
    <tbody className="divide-y divide-line">{entries.map(e=><tr key={e.id}>
     <td className="px-4 py-3 font-mono text-xs">{e.occurred_at}</td><td className="px-4 py-3 uppercase">{e.kind.replaceAll("_"," ")}</td>
     <td className="px-4 py-3 font-mono">{formatPrice(e.amount)}</td>
     <td className="px-4 py-3">{e.order_id?<Link href={`/admin/orders/${e.order_id}`} className="text-accent-deep underline">{e.order_id}</Link>:"—"}</td>
     <td className="px-4 py-3 font-mono text-xs">{e.reference}</td><td className="px-4 py-3 text-ink-soft">{e.description||"—"}</td>
    </tr>)}{!entries.length&&<tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">No adjustments have been recorded yet.</td></tr>}</tbody>
   </table></div>
  </section>
  <p className="text-xs text-ink-soft">This operational view is not a VAT return, tax filing or statutory profit-and-loss statement. Refunds and processor fees must be entered from actual payment records; totals are not inferred from status labels alone.</p>
 </div>;
}
