import Link from "next/link";
import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LeadDeleteButton } from "@/components/admin/lead-delete-button";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { listLeads } from "@/lib/server/store";
import { getSupabase } from "@/lib/server/supabase";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sell To Us" };

function splitNotes(notes?: string) {
  const lines = String(notes ?? "").split("\n");
  return {
    notes: lines.filter((line) => !line.startsWith("PHOTO: ") && !line.startsWith("PRIVATEPHOTO: ")).join("\n").trim(),
    photos: lines
      .filter((line) => line.startsWith("PHOTO: ") || line.startsWith("PRIVATEPHOTO: "))
      .map((line) => line.startsWith("PRIVATEPHOTO: ") ? line : line.slice("PHOTO: ".length).trim())
      .filter(Boolean),
  };
}

export default async function AdminLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!(await requireRole("MANAGER"))) redirect("/admin");
  const allLeads = await listLeads();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const valid = new Set(["NEW","REVIEWING","OFFER_SENT","ACCEPTED","DECLINED","RECEIVED","INSPECTED","PAID"]);
  const status = typeof params.status === "string" && valid.has(params.status) ? params.status : "";
  const leads = allLeads.filter(l=>(!status||l.status===status)&&(!q||[l.name,l.email,l.brand,l.itemType,l.size,l.condition].join(" ").toLowerCase().includes(q)));
  const db = getSupabase();
  const photosByLead = new Map<string, string[]>();
  for (const lead of leads) {
    const refs = splitNotes(lead.notes).photos;
    const paths = refs.filter((ref) => ref.startsWith("PRIVATEPHOTO: "))
      .map((ref) => ref.slice("PRIVATEPHOTO: ".length).trim());
    const signed = paths.length && db
      ? await db.storage.from("lead-photos-private").createSignedUrls(paths, 300)
      : null;
    let next = 0;
    photosByLead.set(lead.id, refs.map((ref) => {
      if (!ref.startsWith("PRIVATEPHOTO: ")) return ref;
      return signed?.data?.[next++]?.signedUrl ?? "";
    }).filter(Boolean));
  }


  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Workspace / Acquisitions</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Sell To Us</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {leads.length} matching submissions · {allLeads.length} total
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{([
        ["New",["NEW"]],["Under review",["REVIEWING","OFFER_SENT"]],["Accepted / inbound",["ACCEPTED","RECEIVED","INSPECTED"]],["Completed",["PAID"]]
      ] as const).map(([label,values])=><div key={label} className="border border-line bg-cream p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</p><p className="mt-2 font-display text-2xl font-semibold">{allLeads.filter(l=>(values as readonly string[]).includes(l.status)).length}</p></div>)}</div>
      <form action="/admin/leads" className="mb-6 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="lead-search">Search submissions</label>
        <input id="lead-search" name="q" defaultValue={typeof params.q==="string"?params.q:""} placeholder="Search seller, email, brand or item…" className="h-11 min-w-0 flex-1 border border-line bg-paper px-4 text-sm sm:max-w-md"/>
        <label className="sr-only" htmlFor="lead-status">Submission status</label>
        <select id="lead-status" name="status" defaultValue={status} className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase"><option value="">All stages</option>{Array.from(valid).map(v=><option value={v} key={v}>{v.replaceAll("_"," ")}</option>)}</select>
        <button type="submit" className="h-11 bg-ink px-5 font-display text-xs font-semibold uppercase tracking-wider text-paper">Apply</button>
        <Link href="/admin/leads" className="flex h-11 items-center font-mono text-xs uppercase text-ink-soft underline underline-offset-4">Clear</Link>
      </form>
      <p className="mb-3 text-xs text-ink-soft">Workflow: New → Reviewing → Offer sent → Accepted → Received → Inspected → Paid. Declined submissions close without purchase.</p>
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
              detail.photos = photosByLead.get(lead.id) ?? [];
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
                  <td className="px-4 py-4"><div className="flex flex-col items-start gap-3"><Link href={`/admin/leads/${lead.id}`} className="font-mono text-[10px] font-semibold uppercase text-accent-deep underline underline-offset-2">Open case →</Link><LeadDeleteButton id={lead.id} /></div></td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">No submissions match these filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
