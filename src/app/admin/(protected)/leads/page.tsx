import type { Metadata } from "next";
import { LeadDeleteButton } from "@/components/admin/lead-delete-button";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { listLeads } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sell To Us" };

function splitNotes(notes?: string) {
  const lines = String(notes ?? "").split("\n");
  return {
    notes: lines.filter((line) => !line.startsWith("PHOTO: ")).join("\n").trim(),
    photos: lines
      .filter((line) => line.startsWith("PHOTO: "))
      .map((line) => line.slice("PHOTO: ".length).trim())
      .filter(Boolean),
  };
}

export default async function AdminLeadsPage() {
  const leads = await listLeads();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">Sell To Us</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {leads.length} {leads.length === 1 ? "lead" : "leads"} · flow: NEW → REVIEWING → OFFER_SENT → ACCEPTED / DECLINED → RECEIVED → INSPECTED → PAID
        </p>
      </div>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Received</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Seller</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Item</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Notes / photos</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const detail = splitNotes(lead.notes);
              return (
                <tr key={lead.id} className="border-b border-line align-top hover:bg-cream/50">
                  <td className="px-4 py-4 font-mono text-xs whitespace-nowrap">{formatDateTime(lead.createdAt)}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{lead.name}</p>
                    <a href={`mailto:${lead.email}`} className="font-mono text-[10px] text-accent-deep underline underline-offset-2">{lead.email}</a>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-display text-xs font-medium uppercase tracking-[0.08em]">{lead.brand} {lead.itemType}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">Size {lead.size} · {lead.condition}</p>
                  </td>
                  <td className="max-w-sm px-4 py-4 text-xs leading-relaxed text-ink-soft">
                    <p className="whitespace-pre-wrap">{detail.notes || "—"}</p>
                    {detail.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {detail.photos.map((src, index) => (
                          <a key={src} href={src} target="_blank" rel="noreferrer" className="block border border-line bg-paper p-1 hover:border-ink" title={`Open photograph ${index + 1}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Submitted photograph ${index + 1}`} className="h-16 w-16 object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <LeadStatusSelect id={lead.id} status={lead.status} currentOffer={lead.offer} />
                    {lead.offer && <p className="mt-1 font-mono text-[10px] text-accent-deep">Offer: {lead.offer}</p>}
                  </td>
                  <td className="px-4 py-4"><LeadDeleteButton id={lead.id} /></td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">No leads yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
