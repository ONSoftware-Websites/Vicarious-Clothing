import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminRole, requireRole } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";
export const dynamic="force-dynamic";
export const metadata={title:"Settings & Integrations | Vicarious"};
function Tile({label,value,detail}:{label:string;value:string;detail?:string}){return <div className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">{label}</p><p className="mt-2 font-display text-xl font-semibold">{value}</p>{detail&&<p className="mt-2 text-xs text-ink-soft">{detail}</p>}</div>;}
export default async function SettingsPage(){
 if(!(await requireRole("OWNER")))redirect("/admin");
 const role=await getAdminRole();
 const db=getSupabase();
 const jobs=db?await db.from("sellerhq_retry_jobs").select("status"):null;
 const counts={pending:0,failed:0,processing:0,done:0};
 for(const row of jobs?.data??[]){const key=row.status as keyof typeof counts;if(Object.prototype.hasOwnProperty.call(counts,key))counts[key]++;}
 return <div className="space-y-8">
   <header className="border-b border-line pb-6"><p className="font-mono text-[10px] uppercase tracking-widest text-accent-deep">Administration / Configuration</p><h1 className="mt-2 font-display text-3xl font-bold uppercase">Settings & Integrations</h1><p className="mt-3 text-sm text-ink-soft">Operational configuration and connection health. Secrets are never displayed here.</p></header>
   <section className="space-y-3"><h2 className="font-display text-sm font-bold uppercase tracking-widest">System configuration</h2>
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       <Tile label="Administrator security" value="Individual login + MFA" detail="Verified Supabase Auth session with AAL2 required"/>
       <Tile label="SellerHQ integration" value={process.env.SELLERHQ_API_KEY||process.env.SELLERHQ_WEBHOOK_SECRET?"Configured":"Configuration not confirmed"} detail="Environment presence is not a live connection test"/>
       <Tile label="Stripe processing" value={process.env.STRIPE_SECRET_KEY?"Configured":"Not configured"} detail="Environment presence only; payments remain managed in Stripe"/>
       <Tile label="Scheduled retries" value="Daily" detail="Existing Vercel cron schedule unchanged"/>
       <Tile label="Maintenance mode" value="Manage separately" detail="No mode switches occur on this screen"/>
       <Tile label="Email delivery" value={process.env.RESEND_API_KEY?"Configured":"Not configured"} detail="Provider configuration presence only"/>
     </div>
   </section>
   <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-sm font-bold uppercase tracking-widest">SellerHQ delivery queue</h2><span className="font-mono text-xs text-ink-soft">Recorded retry jobs</span></div>
     <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Tile label="Pending" value={String(counts.pending)}/><Tile label="Failed" value={String(counts.failed)}/><Tile label="Processing" value={String(counts.processing)}/><Tile label="Completed" value={String(counts.done)}/></div>
     {jobs?.error&&<p className="text-sm text-ink-soft">Queue health could not be retrieved.</p>}
     <p className="text-xs text-ink-soft">Queue totals are stored job counts, not proof that SellerHQ accepted every event. This page does not initiate retries.</p>
   </section>
   <section className="grid gap-3 sm:grid-cols-2"><Link href="/admin/monitoring" className="border border-line p-5 hover:border-accent"><h3 className="font-display text-sm font-bold uppercase">Operations monitoring →</h3><p className="mt-2 text-xs text-ink-soft">Delivery failures, run history and manual recovery</p></Link><Link href="/admin/maintenance" className="border border-line p-5 hover:border-accent"><h3 className="font-display text-sm font-bold uppercase">Maintenance tools →</h3><p className="mt-2 text-xs text-ink-soft">Restricted operational tools and one-off migrations</p></Link>{role==="SUPER_ADMIN"&&<Link href="/admin/staff" className="border border-line p-5 hover:border-accent"><h3 className="font-display text-sm font-bold uppercase">Staff & Permissions →</h3><p className="mt-2 text-xs text-ink-soft">Super-admin membership management</p></Link>}</section>
 </div>;
}
