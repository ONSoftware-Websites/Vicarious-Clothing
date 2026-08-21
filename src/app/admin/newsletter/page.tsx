import type { Metadata } from "next";
import { listSubscribers } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  const subscribers = await listSubscribers();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
            Newsletter
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {subscribers.length} {subscribers.length === 1 ? "subscriber" : "subscribers"} ·
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

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Email</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Source</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Consented</th>
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
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No subscribers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-faint">
        Sign-ups arrive from the homepage capture and the checkout opt-in.
        Sending campaigns itself happens in your email platform — export this
        list and keep it synced there (Phase 3: direct integration).
      </p>
    </div>
  );
}
