import {redirect} from "next/navigation";
import Link from "next/link";
import {requireRole} from "@/lib/server/admin-auth";
import {launchConfigurationChecks} from "@/lib/launch-checks";

export const dynamic="force-dynamic";
export const metadata={title:"Launch Readiness | Vicarious Clothing"};
export default async function LaunchReadinessPage(){
 if(!(await requireRole("OWNER")))redirect("/admin");
 const checks=launchConfigurationChecks(process.env);
 const passed=checks.filter(c=>c.ok).length;
 return <main className="space-y-7">
  <header className="border-b border-line pb-6">
   <p className="font-mono text-[10px] uppercase tracking-widest text-accent-deep">Administration / Launch quality</p>
   <h1 className="mt-2 font-display text-3xl font-bold uppercase">Launch readiness</h1>
   <p className="mt-3 max-w-2xl text-sm text-ink-soft">Safe, server-side environment checks. Only configuration presence and canonical HTTPS validity are shown; no keys, tokens or secrets are exposed.</p>
  </header>
  <div className="border border-line bg-cream p-5"><p className="font-display text-2xl font-semibold">{passed} / {checks.length} checks passed</p><p className="mt-2 text-xs text-ink-soft">A passing configuration check does not prove the corresponding service is reachable or a payment works.</p></div>
  <ul className="divide-y divide-line border border-line">{checks.map(check=><li key={check.name} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
   <div><h2 className="text-sm font-semibold">{check.name}</h2><p className="mt-1 text-xs text-ink-soft">{check.detail}</p></div>
   <span className={`border px-3 py-1 font-mono text-[10px] uppercase ${check.ok?"border-emerald-300 text-emerald-800":"border-amber-300 text-amber-900"}`}>{check.ok?"Configured":"Needs review"}</span>
  </li>)}</ul>
  <section className="border border-line p-5"><h2 className="font-display text-sm font-semibold uppercase">Release acceptance</h2><p className="mt-2 text-sm text-ink-soft">Before removing maintenance, independently verify a successful production build, Stripe test purchase and refund, stock reservation, Sell To Us journey, customer login, email delivery, mobile accessibility, and legal policy accuracy.</p>
   <div className="mt-4 flex flex-wrap gap-3"><Link href="/admin/monitoring" className="border border-line px-4 py-2 font-mono text-xs uppercase">Operations monitoring</Link><Link href="/admin/settings" className="border border-line px-4 py-2 font-mono text-xs uppercase">Integrations settings</Link></div>
  </section>
 </main>;
}
