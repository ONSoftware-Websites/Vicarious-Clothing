import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { listEmails } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Emails" };

export default async function EmailsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!(await requireRole("ADMIN"))) redirect("/admin");
  const allEmails = await listEmails(100);
  const raw=await searchParams;
  const q=typeof raw.q==="string"?raw.q.trim().toLowerCase():"";
  const status=raw.status==="sent"||raw.status==="logged"?raw.status:"";
  const emails=allEmails.filter(e=>(!status||(status==="sent"?e.status==="sent":e.status!=="sent"))&&(!q||[e.to,e.template,e.subject].join(" ").toLowerCase().includes(q)));
  const delivered=allEmails.filter(e=>e.status==="sent").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
          Email activity
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Provider-accepted and locally logged email requests. A provider-accepted message is not proof of final mailbox delivery. Recent provider rejections are available in Operations Monitoring.
        </p>
      </div>

      <p className="mb-4 text-xs text-ink-soft">Delivery failures that prevent logging are recorded as operational exceptions. See <a className="underline" href="/admin/monitoring">Operations Monitoring</a> if you have Owner access.</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">{[["Recent records",allEmails.length],["Accepted by provider",delivered],["Logged locally",allEmails.length-delivered]].map(([title,value])=><div key={title} className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{title}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></div>)}</div>
      <form action="/admin/emails" className="mb-5 flex flex-wrap gap-3"><label className="sr-only" htmlFor="email-search">Search emails</label><input id="email-search" name="q" defaultValue={typeof raw.q==="string"?raw.q:""} placeholder="Search recipient, subject or template…" className="h-11 min-w-0 flex-1 border border-line bg-paper px-4 text-sm"/><label className="sr-only" htmlFor="email-status">Delivery record status</label><select name="status" id="email-status" defaultValue={status} className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase"><option value="">All records</option><option value="sent">Sent via provider</option><option value="logged">Logged locally</option></select><button type="submit" className="bg-ink px-5 font-display text-xs font-semibold uppercase text-paper">Apply</button><a href="/admin/emails" className="self-center font-mono text-xs uppercase underline">Clear</a></form>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Sent</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">To</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Template</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Subject</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} className="border-b border-line hover:bg-cream/50">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                  {formatDateTime(e.sentAt)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.to}</td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-accent-deep">
                  {e.template}
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">{e.subject}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.status === "sent"
                        ? "border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        : "border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint"
                    }
                  >
                    {e.status === "sent" ? `Sent via ${e.provider}` : "Logged to file"}
                  </span>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No emails yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
