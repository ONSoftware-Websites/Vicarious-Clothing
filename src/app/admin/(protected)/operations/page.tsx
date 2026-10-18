import { SellerHqRetryAction } from "@/components/admin/sellerhq-retry-action";
import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
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
  if (!(await requireRole("MANAGER"))) redirect("/admin");
  const canManageFinance = await requireRole("ADMIN");
  const [orders,products,leads,purchases] = await Promise.all([
    listOrders(),listProducts(),listLeads(),canManageFinance ? listPurchases() : Promise.resolve([])
  ]);
  const db = getSupabase();
  const retry = db ? await db.from("sellerhq_retry_jobs")
    .select("id", {head:true,count:"exact"}).in("status",["pending","failed","processing"]) : null;
  const recentEvents = db ? await db.from("operational_events").select("id,subsystem,severity,event,details,created_at").in("severity",["warning","error"]).order("created_at",{ascending:false}).limit(15) : null;
  const deadLetters = db ? await db.from("sellerhq_retry_jobs").select("id,last_error,attempts,updated_at").eq("status","dead_letter").order("updated_at",{ascending:false}).limit(10) : null;
  const notificationJobs = db && canManageFinance ? await db.from("order_notification_retries").select("id,order_id,template,status,attempts,last_error").in("status",["pending","failed","dead_letter"]).order("id",{ascending:false}).limit(15) : null;
  const paymentFlags = db && canManageFinance ? await db.from("operational_events").select("id,event,details,created_at").in("event",["payment_order_discrepancy","payment_audit_unavailable"]).order("created_at",{ascending:false}).limit(12) : null;
  const pendingAttempts = orders.filter(o=>o.status==="PENDING_PAYMENT");
  const outstanding = orders.filter(o=>["PAID","PICKING","READY_TO_DISPATCH"].includes(o.status));
  const openLeads = leads.filter(l=>["NEW","REVIEWING","OFFER_SENT","ACCEPTED","RECEIVED","INSPECTED"].includes(l.status));
  const missingPhotos = products.filter(p=>p.status==="DRAFT" && !p.images.length);
  const unpriced = products.filter(p=>!Number.isFinite(p.price) || p.price<=0);
  const unpaid = purchases.filter(p=>p.status!=="PAID");
  const returns = orders.filter(o=>o.status==="RETURN_REQUESTED");
  const awaitingInspection = leads.filter(l=>l.status==="RECEIVED");
  const unlinkedPurchases = purchases.filter(p=>p.items.length===0);
  return <div className="space-y-8">
    <header><h1 className="font-display text-3xl font-bold uppercase">Operations centre</h1>
      <p className="mt-2 text-sm text-ink-soft">Prioritise fulfilment, seller offers, listing quality and SellerHQ integration health.</p>
    </header>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {canManageFinance && <Metric label="Notification exceptions" count={notificationJobs?.data?.length??0} href="/admin/operations"/>}
      {canManageFinance && <Metric label="Payment audit alerts" count={paymentFlags?.data?.length??0} href="/admin/operations"/>}
      {canManageFinance && <Metric label="Pending checkout attempts" count={pendingAttempts.length} href="/admin/orders?status=PENDING_PAYMENT"/>}
      {canManageFinance && <Metric label="SellerHQ dead letters" count={deadLetters?.data?.length??0} href="/admin/operations"/>}
      {canManageFinance && <Metric label="Orders to fulfil" count={outstanding.length} href="/admin/orders"/>}
      <Metric label="Open seller enquiries" count={openLeads.length} href="/admin/leads"/>
      {canManageFinance && <Metric label="Outstanding seller payments" count={unpaid.length} href="/admin/purchases"/>}
      {canManageFinance && <Metric label="Customer returns to review" count={returns.length} href="/admin/orders?queue=returns"/>}
      <Metric label="Seller items awaiting inspection" count={awaitingInspection.length} href="/admin/leads?status=RECEIVED"/>
      {canManageFinance && <Metric label="Purchases without stock links" count={unlinkedPurchases.length} href="/admin/purchases"/>}
      <Metric label="Drafts missing photographs" count={missingPhotos.length} href="/admin/inventory?status=DRAFT"/>
      <Metric label="Products needing valid pricing" count={unpriced.length} href="/admin/inventory"/>
      {canManageFinance && <Metric label="SellerHQ deliveries outstanding" count={retry?.count??0} href="/admin/analytics"/>}
    </div>
    {canManageFinance && <section className="border border-line p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold uppercase">Integration and checkout alerts</h2><p className="mt-1 text-sm text-ink-soft">Recent operational warnings and failures. Investigate before retrying payment or stock operations.</p></div><Link href="/admin/operations" className="font-mono text-xs underline">Refresh page</Link></div>
      <div className="mt-4 divide-y divide-line">{(recentEvents?.data??[]).map(event=><div key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><span className={event.severity==="error"?"font-semibold text-red-700":"font-semibold text-amber-800"}>{event.severity.toUpperCase()}</span><span className="ml-3 font-mono text-xs">{event.subsystem} · {event.event}</span></div><span className="text-xs text-ink-soft">{event.created_at?new Date(event.created_at).toLocaleString("en-GB"):""}</span></div>)}{!recentEvents?.data?.length&&<p className="py-4 text-sm text-ink-soft">No recent integration alerts.</p>}</div>
      {recentEvents?.error&&<p role="alert" className="text-sm text-red-700">Operational alerts could not be loaded.</p>}
    </section>}
    {canManageFinance && <section className="border border-line p-6"><h2 className="font-display text-lg font-bold uppercase">SellerHQ delivery exceptions</h2><div className="mt-3"><SellerHqRetryAction /></div><p className="mt-2 text-sm text-ink-soft">Dead-letter jobs require investigation; the retry worker will not automatically resend them.</p><div className="mt-3 divide-y divide-line">{(deadLetters?.data??[]).map(job=><div key={job.id} className="py-3 text-xs"><strong className="font-mono">Job {job.id} · {job.attempts} attempts</strong><p className="mt-1 text-ink-soft">{job.last_error||"No error details available"}</p></div>)}{!deadLetters?.data?.length&&<p className="py-4 text-sm text-ink-soft">No dead-letter jobs.</p>}</div></section>}
    {canManageFinance && <section className="border border-line p-6"><h2 className="font-display text-lg font-bold uppercase">Customer notification recovery</h2><p className="mt-2 text-sm text-ink-soft">Failed emails are retried only when the order lifecycle still matches. Refund and cancellation messages require manual review.</p><div className="mt-3 divide-y divide-line">{(notificationJobs?.data??[]).map(job=><div key={job.id} className="py-3 text-xs"><p className="font-mono font-semibold">{job.order_id} · {job.template} · {job.status} · {job.attempts} attempts</p>{job.last_error&&<p className="mt-1 text-ink-soft">{job.last_error}</p>}</div>)}{!notificationJobs?.data?.length&&<p className="py-4 text-sm text-ink-soft">No notification exceptions.</p>}</div></section>}
    {canManageFinance && <section className="border border-line p-6"><h2 className="font-display text-lg font-bold uppercase">Financial reconciliation exceptions</h2><p className="mt-2 text-sm text-ink-soft">Read-only Stripe comparisons. Review discrepancies before making any financial adjustment.</p><div className="mt-3 divide-y divide-line">{(paymentFlags?.data??[]).map(event=><div key={event.id} className="py-3 text-xs"><p className="font-mono font-semibold">{event.event}</p><p className="mt-1 text-ink-soft">Order {String((event.details as Record<string,unknown>|null)?.orderId??"unknown")} · {new Date(event.created_at).toLocaleString("en-GB")}</p></div>)}{!paymentFlags?.data?.length&&<p className="py-4 text-sm text-ink-soft">No recorded financial discrepancies.</p>}</div></section>}
    {canManageFinance && returns.length>0 && <section className="border border-line p-6"><h2 className="font-display text-lg font-bold uppercase">Customer returns awaiting action</h2><div className="mt-4 space-y-3">{returns.slice(0,10).map(order=><Link key={order.id} href={`/admin/orders/${order.id}`} className="flex justify-between border-b border-line py-3 text-sm hover:text-accent-deep"><span>{order.id} · {order.name}</span><span className="font-mono text-xs">Review →</span></Link>)}</div></section>}
    {canManageFinance && <section className="border border-line p-6">
      <h2 className="font-display text-lg font-bold uppercase">Fulfilment queue</h2>
      <div className="mt-4 space-y-3">
        {outstanding.slice(0,15).map(order=><Link key={order.id} href={`/admin/orders/${order.id}`}
          className="flex items-center justify-between border-b border-line py-3 text-sm hover:text-accent-deep">
          <span>{order.id} · {order.items.length} item(s)</span><span className="font-mono text-xs">{order.status}</span>
        </Link>)}
        {!outstanding.length && <p className="text-sm text-ink-soft">No outstanding fulfilment orders.</p>}
      </div>
    </section>}
  </div>;
}
