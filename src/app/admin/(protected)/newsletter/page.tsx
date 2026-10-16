import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { listSubscribers } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";
import { NewsletterAddForm } from "@/components/admin/newsletter-add-form";
import { NewsletterRow } from "@/components/admin/newsletter-row";
import { NewsletterSendForm } from "@/components/admin/newsletter-send-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Newsletter" };

export default async function NewsletterPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!(await requireRole("MANAGER"))) redirect("/admin");
  const allSubscribers = await listSubscribers();
  const params=await searchParams;
  const q=typeof params.q==="string"?params.q.trim().toLowerCase():"";
  const subscribers=allSubscribers.filter(s=>!q||[s.email,s.source].join(" ").toLowerCase().includes(q));

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
            Newsletter
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {allSubscribers.length} {allSubscribers.length === 1 ? "subscriber" : "subscribers"} ·
            marketing consent recorded separately from orders
          </p>
        </div>
        <a
          href="/api/admin/newsletter/export"
          className="flex h-11 items-center justify-center border border-ink px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
        >
          Export CSV
        </a>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3"><div className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Consented subscribers</p><p className="mt-2 font-display text-3xl font-semibold">{allSubscribers.length}</p></div><div className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Matching records</p><p className="mt-2 font-display text-3xl font-semibold">{subscribers.length}</p></div></div>
      <details className="mb-8 border border-line"><summary className="cursor-pointer bg-cream p-5 font-display text-xs font-semibold uppercase tracking-widest">+ Add consented subscriber</summary><div className="p-5">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em]">Add subscriber manually</h2>
        <p className="mb-4 text-xs leading-relaxed text-ink-faint">Add someone who gave consent offline or via another channel. Consent is recorded with source and timestamp for GDPR.</p>
        <NewsletterAddForm />
      </div></details>

      <div className="mb-8">
        <NewsletterSendForm count={allSubscribers.length} />
      </div>

      <form action="/admin/newsletter" className="mb-4 flex flex-wrap gap-3"><label className="sr-only" htmlFor="subscriber-search">Search subscribers</label><input id="subscriber-search" name="q" defaultValue={typeof params.q==="string"?params.q:""} placeholder="Search email or consent source…" className="h-11 flex-1 border border-line bg-paper px-4 text-sm"/><button type="submit" className="bg-ink px-5 font-display text-xs font-semibold uppercase text-paper">Search</button><a href="/admin/newsletter" className="self-center font-mono text-xs uppercase underline">Clear</a></form>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Email</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Source</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Consented</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.email} className="border-b border-line hover:bg-cream/50">
                <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {s.source}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatDateTime(s.consentedAt)}
                </td>
                <td className="px-4 py-3">
                  <NewsletterRow email={s.email} />
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No subscribers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-faint">
        Sign-ups arrive from the homepage capture and the checkout opt-in. You can now send directly via Resend above, or export CSV to sync with another platform.
      </p>
    </div>
  );
}
