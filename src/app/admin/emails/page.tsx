import type { Metadata } from "next";
import { listEmails } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Emails" };

export default function EmailsPage() {
  const emails = listEmails(100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Transactional email
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Every email the store sends, in one place. Without a provider key
          configured, emails are written as HTML files in{" "}
          <code className="font-mono text-xs">.data/emails/</code> instead of
          being delivered.
        </p>
      </div>

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
