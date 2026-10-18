import Link from "next/link";
import {redirect} from "next/navigation";
import {requireRole} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
import {RetryDeadLetter} from "@/components/admin/retry-dead-letter";

export const dynamic="force-dynamic";
export const metadata={title:"Operations Monitoring | Vicarious Clothing"};
export default async function MonitoringPage(){
 if(!(await requireRole("OWNER")))redirect("/admin");
 const db=getSupabase();
 if(!db)return <p role="alert" className="p-8">Operational monitoring is unavailable.</p>;
 const [events,jobs,emails]=await Promise.all([
  db.from("operational_events").select("id,subsystem,severity,event,details,created_at").order("created_at",{ascending:false}).limit(100),
  db.from("sellerhq_retry_jobs").select("id,status,attempts,last_error,updated_at,retry_after").order("updated_at",{ascending:false}).limit(200),
  db.from("email_log").select("status,sent_at").order("sent_at",{ascending:false}).limit(100)
 ]);
 if(events.error||jobs.error||emails.error)return <p role="alert" className="p-8">Operational records could not be retrieved. Status cannot be verified.</p>;
 const eventRows=events.data??[], jobRows=jobs.data??[], emailRows=emails.data??[];
 const dead=jobRows.filter(j=>j.status==="dead_letter");
 const failed=jobRows.filter(j=>j.status==="failed");
 const lastRun=eventRows.find(e=>e.subsystem==="cron"&&e.event==="daily_job_completed");
 const lastCronError=eventRows.find(e=>e.subsystem==="cron"&&e.severity==="error");
 const last24h=Date.now()-24*60*60*1000;
 const stale=!lastRun||Date.parse(lastRun.created_at)<last24h;
 return <div className="space-y-8">
  <header className="border-b border-line pb-6">
   <p className="font-mono text-[10px] uppercase tracking-widest text-accent-deep">Administration / Observability</p>
   <h1 className="mt-2 font-display text-3xl font-bold uppercase">Operations Monitoring</h1>
   <p className="mt-3 text-sm text-ink-soft">Read-only diagnostic overview with controlled SellerHQ recovery. Events are system-reported; they are not proof of final delivery to external destinations.</p>
   <div className="mt-5 flex gap-3"><Link href="/admin/settings" className="border border-line px-4 py-2 font-mono text-xs uppercase">Settings</Link><Link href="/admin/emails" className="border border-line px-4 py-2 font-mono text-xs uppercase">Email logs</Link></div>
  </header>
  {stale&&<div role="alert" className="border border-amber-300 bg-amber-50 p-4 text-sm">No successful cron completion is recorded within the last 24 hours. Review Vercel scheduling and deployment health.</div>}
  {lastCronError&&(!lastRun||lastCronError.created_at>lastRun.created_at)&&<div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm">The most recent cron error has no later successful completion.</div>}
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   {[["Recent logged events",eventRows.length],["SellerHQ retry failures",failed.length],["Dead-letter items",dead.length],["Recently logged emails",emailRows.length]].map(([label,value])=><div key={label} className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase text-ink-soft">{label}</p><p className="mt-2 font-display text-3xl font-semibold">{value}</p></div>)}
  </div>
  <p className="text-xs text-ink-soft">These are counts within the most recent 100 events/emails and 200 delivery jobs, not all-time totals.</p>
  <section className="border border-line p-5"><h2 className="font-display text-sm font-bold uppercase">Scheduled processing</h2>
   <p className="mt-2 text-sm">{lastRun?new Date(lastRun.created_at).toLocaleString("en-GB",{timeZone:"Europe/London"}):"No recorded successful run yet"} · existing once-daily schedule</p>
   <p className="mt-2 text-xs text-ink-soft">The cron has not been rescheduled. Its run history begins when this release is deployed.</p>
  </section>
  <section className="space-y-4"><h2 className="font-display text-sm font-bold uppercase">SellerHQ delivery exceptions</h2>
   {dead.length===0?<p className="text-sm text-ink-soft">No dead-letter jobs in the displayed window.</p>:<div className="overflow-x-auto border border-line"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-cream"><tr>{["Job","Attempts","Last error","Recovery"].map(h=><th className="px-4 py-3 text-xs" key={h}>{h}</th>)}</tr></thead><tbody>{dead.map(j=><tr className="border-t border-line" key={j.id}><td className="px-4 py-3 font-mono">{j.id}</td><td className="px-4 py-3">{j.attempts}</td><td className="max-w-sm break-words px-4 py-3">{j.last_error??"Unknown"}</td><td className="px-4 py-3"><RetryDeadLetter id={j.id}/></td></tr>)}</tbody></table></div>}
  </section>
  <section className="space-y-4"><h2 className="font-display text-sm font-bold uppercase">System activity</h2>
   <div className="overflow-x-auto border border-line"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-cream"><tr>{["Time","Area","Severity","Event"].map(h=><th key={h} className="px-4 py-3 text-xs">{h}</th>)}</tr></thead><tbody>{eventRows.map(e=><tr key={e.id} className="border-t border-line"><td className="px-4 py-3 font-mono text-xs">{new Date(e.created_at).toLocaleString("en-GB",{timeZone:"Europe/London"})}</td><td className="px-4 py-3">{e.subsystem}</td><td className="px-4 py-3">{e.severity}</td><td className="px-4 py-3 font-mono text-xs">{e.event}</td></tr>)}</tbody></table></div>
  </section>
 </div>;
}
