import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/server/admin-auth";
import { listDiscounts, listSubscribers, listEmails } from "@/lib/server/store";

export const dynamic="force-dynamic";
export const metadata={title:"Marketing | Vicarious Clothing"};

export default async function MarketingPage() {
  if (!(await requireRole("MANAGER"))) redirect("/admin");
  const canManageDiscounts=await requireRole("ADMIN");
  const [subscribers,emails,discounts]=await Promise.all([
    listSubscribers(),canManageDiscounts?listEmails(100):Promise.resolve([]),canManageDiscounts?listDiscounts():Promise.resolve([])
  ]);
  const destinations=[
    {title:"Newsletter",href:"/admin/newsletter",count:subscribers.length,unit:"Consented subscribers",description:"Manage consent records and newsletter campaigns"},
    ...(canManageDiscounts?[
      {title:"Discount codes",href:"/admin/discounts",count:discounts.length,unit:"Promotion codes",description:"Create, manage and review checkout offers"},
      {title:"Email activity",href:"/admin/emails",count:emails.length,unit:"Recent records",description:"Review transactional messages and provider delivery records"}
    ]:[])
  ];
  return <div className="space-y-8">
    <header className="border-b border-line pb-7"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Business / Communications</p><h1 className="font-display text-3xl font-bold uppercase tracking-tight">Marketing</h1><p className="mt-3 max-w-2xl text-sm text-ink-soft">One workspace for promotions, subscribers and customer communications. Access is restricted according to your staff role.</p></header>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{destinations.map(d=><Link key={d.href} href={d.href} className="group flex min-h-48 flex-col justify-between border border-line bg-cream p-6 transition-colors hover:border-accent">
      <div><p className="font-display text-sm font-bold uppercase tracking-[0.12em]">{d.title}</p><p className="mt-2 text-sm text-ink-soft">{d.description}</p></div>
      <div className="mt-6 flex items-end justify-between"><div><p className="font-display text-3xl font-semibold">{d.count}</p><p className="font-mono text-[10px] uppercase text-ink-faint">{d.unit}</p></div><span className="font-mono text-sm text-accent-deep">Open →</span></div>
    </Link>)}</div>
    <p className="text-xs text-ink-soft">Newsletter messages require a recorded marketing-consent basis. Email records reflect the last 100 entries, not lifetime delivery totals.</p>
  </div>;
}
