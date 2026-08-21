import type { Metadata } from "next";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { listLeads } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sell To Us" };

export default async function AdminLeadsPage() {
  const leads = await listLeads();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Sell To Us
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {leads.length} {leads.length === 1 ? "lead" : "leads"} · flow: NEW →
          REVIEWING → OFFER_SENT → ACCEPTED / DECLINED → RECEIVED → INSPECTED →
          PAID
        </p>
      </div>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Received</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Seller</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Item</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Notes</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4 font-mono text-xs whitespace-nowrap">
                  {formatDateTime(lead.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{lead.name}</p>
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-mono text-[10px] text-accent-deep underline underline-offset-2"
                  >
                    {lead.email}
                  </a>
                </td>
                <td className="px-4 py-4">
                  <p className="font-display text-xs font-medium uppercase tracking-[0.08em]">
                    {lead.brand} {lead.itemType}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                    Size {lead.size} · {lead.condition}
                  </p>
                </td>
                <td className="max-w-xs px-4 py-4 text-xs leading-relaxed text-ink-soft">
                  {lead.notes ?? "—"}
                </td>
                <td className="px-4 py-4">
                  <LeadStatusSelect id={lead.id} status={lead.status} />
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No leads yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
