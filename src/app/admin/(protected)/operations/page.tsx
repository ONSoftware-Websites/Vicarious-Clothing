import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, listProducts, listLeads, listPurchases } from "@/lib/server/store";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Operations | Vicarious Clothing" };

function Metric({label,count,href}:{label:string;count:number;href:string}) {
  return <Link href={href} className="block border border-line bg-cream p-6 transition-colors hover:border-accent">
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</p>
    <p className="mt-2 font-display text-4xl font-semibold">{count}</p>
  </Link>;
}

export default async function OperationsPage() {
  const [orders,products,leads,purchases] = await Promise.all([
    listOrders(),listProducts(),listLeads(),listPurchases()
  ]);
  const db = getSupabase();
  const retry = db ? await db.from("sellerhq_retry_jobs")
    .select("id", {head:true,count:"exact"}).in("status",["pending","failed","processing"]) : null;
  const outstanding = orders.filter(o=>["PAID","PICKING","READY_TO_DISPATCH"].includes(o.status));
  const openLeads = leads.filter(l=>["NEW","REVIEWING","OFFER_SENT","ACCEPTED"].includes(l.status));
  const missingPhotos = products.filter(p=>p.status==="DRAFT" && !p.images.length);
  const unpriced = products.filter(p=>!Number.isFinite(p.price) || p.price<=0);
  const unpaid = purchases.filter(p=>p.status!=="PAID");
  return <div className="space-y-8">
    <header><h1 className="font-display text-3xl font-bold uppercase">Operations centre</h1>
      <p className="mt-2 text-sm text-ink-soft">Prioritise fulfilment, seller offers, listing quality and SellerHQ integration health.</p>
    </header>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Metric label="Orders to fulfil" count={outstanding.length} href="/admin/orders"/>
      <Metric label="Open seller enquiries" count={openLeads.length} href="/admin/leads"/>
      <Metric label="Outstanding seller payments" count={unpaid.length} href="/admin/purchases"/>
      <Metric label="Drafts missing photographs" count={missingPhotos.length} href="/admin/inventory?status=DRAFT"/>
      <Metric label="Products needing valid pricing" count={unpriced.length} href="/admin/inventory"/>
      <Metric label="SellerHQ deliveries outstanding" count={retry?.count??0} href="/admin/analytics"/>
    </div>
    <section className="border border-line p-6">
      <h2 className="font-display text-lg font-bold uppercase">Fulfilment queue</h2>
      <div className="mt-4 space-y-3">
        {outstanding.slice(0,15).map(order=><Link key={order.id} href={`/admin/orders/${order.id}`}
          className="flex items-center justify-between border-b border-line py-3 text-sm hover:text-accent-deep">
          <span>{order.id} · {order.items.length} item(s)</span><span className="font-mono text-xs">{order.status}</span>
        </Link>)}
        {!outstanding.length && <p className="text-sm text-ink-soft">No outstanding fulfilment orders.</p>}
      </div>
    </section>
  </div>;
}
