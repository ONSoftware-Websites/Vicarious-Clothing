import Link from "next/link";
import { listAuditLog, listLeads, listOrders, listProducts } from "@/lib/server/store";
import { formatPrice, isAgedDays } from "@/lib/utils";
import { FormatDateTime, Now } from "@/components/time";
import { getAdminRole, requireRole } from "@/lib/server/admin-auth";

export const dynamic="force-dynamic";

function Metric({title,value,detail,href}:{title:string;value:string;detail:string;href?:string}) {
  const body=<div className="group h-full border border-line bg-cream px-5 py-6 transition-colors hover:border-accent">
    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-ink-soft">{title}</p>
    <p className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{value}</p>
    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{detail}</p>
  </div>;
  return href?<Link href={href} className="block focus-visible:outline-2 focus-visible:outline-accent">{body}</Link>:body;
}

export default async function AdminDashboardPage() {
  const [role, products, orders, leads, auditLog]=await Promise.all([
    getAdminRole(),listProducts(),listOrders(),listLeads(),listAuditLog(8)
  ]);
  const canFinance=await requireRole("ADMIN");
  const canOperate=await requireRole("MANAGER");
  const now=new Date();
  const dayStart=new Date(now);dayStart.setHours(0,0,0,0);
  const paidStatuses=new Set(["PAID","PICKING","READY_TO_DISPATCH","DISPATCHED","DELIVERED","RETURN_REQUESTED","RETURNED"]);
  const paidOrders=orders.filter(o=>paidStatuses.has(o.status));
  const todayOrders=paidOrders.filter(o=>new Date(o.createdAt)>=dayStart);
  const revenueToday=todayOrders.reduce((s,o)=>s+o.total,0);
  const needsFulfilment=orders.filter(o=>["PAID","PICKING","READY_TO_DISPATCH"].includes(o.status));
  const openLeads=leads.filter(l=>["NEW","REVIEWING","OFFER_SENT"].includes(l.status));
  const available=products.filter(p=>p.status==="AVAILABLE").length;
  const drafts=products.filter(p=>p.status==="DRAFT").length;
  const aged=products.filter(p=>p.status==="AVAILABLE"&&isAgedDays(p.listedAt,60)).length;
  const withoutImages=products.filter(p=>p.status==="DRAFT"&&!p.images?.length).length;
  const alerts=[
    ...(canFinance && needsFulfilment.length?[{label:"Orders awaiting fulfilment",count:needsFulfilment.length,href:"/admin/orders"}]:[]),
    ...(canOperate && openLeads.length?[{label:"Seller enquiries to review",count:openLeads.length,href:"/admin/leads"}]:[]),
    ...(canOperate && withoutImages?[{label:"Draft listings missing photos",count:withoutImages,href:"/admin/inventory?status=DRAFT"}]:[]),
    ...(canOperate && aged?[{label:"Listings aged over 60 days",count:aged,href:"/admin/inventory?status=AVAILABLE"}]:[]),
  ];
  return <div className="space-y-9">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
      <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-deep">Vicarious Clothing / Back office</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Overview</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint"><Now /> · {role.replaceAll("_"," ")}</p>
      </div>
      {canOperate&&<div className="flex flex-wrap gap-2">
        <Link href="/admin/inventory/new" className="bg-ink px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-widest text-paper hover:bg-accent-deep">+ Add product</Link>
        <Link href="/admin/operations" className="border border-ink px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-widest hover:bg-cream">Operations ↗</Link>
      </div>}
    </div>
    <section aria-label="Key performance indicators">
      <div className="mb-3 flex items-baseline justify-between"><h2 className="font-display text-xs font-semibold uppercase tracking-[0.17em]">At a glance</h2><span className="font-mono text-[10px] uppercase text-ink-faint">Live records</span></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {canFinance&&<Metric title="Revenue today" value={formatPrice(revenueToday)} detail="Paid orders · today" href="/admin/analytics"/>}
        {canFinance&&<Metric title="Paid orders today" value={String(todayOrders.length)} detail="Excludes pending / refunds" href="/admin/orders"/>}
        {canOperate&&<Metric title="Available inventory" value={String(available)} detail={`${drafts} drafts in preparation`} href="/admin/inventory"/>}
        {canOperate&&<Metric title="Open seller enquiries" value={String(openLeads.length)} detail="Awaiting review or decision" href="/admin/leads"/>}
      </div>
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <section className="border border-line bg-paper">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div><h2 className="font-display text-sm font-semibold uppercase tracking-wider">Action required</h2><p className="mt-1 text-xs text-ink-soft">Items that may need attention</p></div>
          {canOperate&&<Link href="/admin/operations" className="font-mono text-[10px] uppercase text-accent-deep underline underline-offset-4">All operations →</Link>}
        </div>
        {alerts.length?<div className="divide-y divide-line">{alerts.map(a=><Link key={a.label} href={a.href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream">
          <span className="text-sm font-medium">{a.label}</span><span className="min-w-8 bg-accent-tint px-2 py-1 text-center font-mono text-xs font-bold text-accent-deep">{a.count}</span>
        </Link>)}</div>:<p className="px-5 py-8 text-sm text-ink-soft">No outstanding actions in your permitted areas.</p>}
      </section>
      <section className="border border-line bg-cream">
        <div className="border-b border-line px-5 py-4"><h2 className="font-display text-sm font-semibold uppercase tracking-wider">Inventory snapshot</h2></div>
        <div className="space-y-5 p-5">
          {[["Available",available],["Draft",drafts],["Sold",products.filter(p=>p.status==="SOLD").length],["Aged 60+ days",aged]].map(([name,count])=><div key={name} className="flex items-center justify-between border-b border-line pb-3"><span className="font-mono text-xs uppercase tracking-wider text-ink-soft">{name}</span><span className="font-display text-xl font-semibold">{count}</span></div>)}
          {canOperate&&<Link href="/admin/inventory" className="inline-block pt-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-deep underline underline-offset-4">Manage inventory →</Link>}
        </div>
      </section>
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      {canFinance&&<section className="border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-sm font-semibold uppercase tracking-wider">Recent orders</h2><Link href="/admin/orders" className="font-mono text-[10px] uppercase text-accent-deep">View all →</Link></div>
        <div className="divide-y divide-line">{orders.slice(0,6).map(o=><Link key={o.id} href={`/admin/orders/${o.id}`} className="flex justify-between gap-4 px-5 py-4 hover:bg-cream"><div className="min-w-0"><p className="truncate font-mono text-xs">{o.id}</p><p className="text-xs text-ink-soft">{o.name}</p></div><div className="text-right"><p className="font-mono text-[10px] uppercase text-ink-soft">{o.status.replaceAll("_"," ")}</p><p className="mt-1 font-mono text-xs">{formatPrice(o.total)}</p></div></Link>)}
          {!orders.length&&<p className="p-5 text-sm text-ink-soft">No orders yet.</p>}</div>
      </section>}
      <section className="border border-line">
        <div className="border-b border-line px-5 py-4"><h2 className="font-display text-sm font-semibold uppercase tracking-wider">Recent activity</h2></div>
        <div className="divide-y divide-line">{auditLog.map(e=><div key={e.id} className="px-5 py-3">
          <p className="text-sm"><span className="font-semibold">{e.actor}</span> {e.action}</p><p className="mt-1 truncate font-mono text-[10px] text-ink-soft">{e.detail}</p><p className="mt-1 font-mono text-[10px] text-ink-faint"><FormatDateTime date={e.at}/></p>
        </div>)}{!auditLog.length&&<p className="p-5 text-sm text-ink-soft">No recent activity.</p>}</div>
      </section>
    </div>
  </div>;
}
