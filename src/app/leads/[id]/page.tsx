import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { LeadDecisionButtons } from "@/components/lead-decision-buttons";
import { listLeads } from "@/lib/server/store";
import { verifyLeadAccessToken } from "@/lib/server/lead-access";

export const dynamic = "force-dynamic";

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

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; intent?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const lead = (await listLeads()).find((entry) => entry.id === id);
  if (!lead || !query.token || !verifyLeadAccessToken(lead.id, lead.email, query.token)) {
    notFound();
  }

  const { notes, photos } = splitNotes(lead.notes);
  const awaitingDecision = lead.status === "OFFER_SENT";

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">
          Sell to us · {lead.id}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight">
          Your Vicarious submission
        </h1>

        <div className="mt-8 border border-line bg-paper p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="font-mono text-[10px] uppercase text-ink-faint">Item</p><p className="mt-1 text-sm">{lead.brand} {lead.itemType}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-ink-faint">Size</p><p className="mt-1 text-sm">{lead.size}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-ink-faint">Condition</p><p className="mt-1 text-sm">{lead.condition}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-ink-faint">Status</p><p className="mt-1 text-sm">{lead.status.replaceAll("_", " ")}</p></div>
          </div>
          {notes && <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{notes}</p>}
        </div>

        {photos.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">Submitted photographs</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={`Submitted item photograph ${index + 1}`} className="aspect-square w-full object-cover" />
              ))}
            </div>
          </div>
        )}

        {lead.offer && (
          <div className="mt-8 border border-line bg-cream p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Provisional offer</p>
            <p className="mt-2 font-display text-2xl font-semibold">{lead.offer}</p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              The final purchase remains subject to the item matching the description, condition, photographs and authenticity information supplied.
            </p>
            {awaitingDecision && (
              <div className="mt-6">
                <LeadDecisionButtons id={lead.id} token={query.token} initialIntent={query.intent} />
              </div>
            )}
          </div>
        )}

        {!awaitingDecision && lead.offer && (
          <p className="mt-6 text-sm text-ink-soft">
            This offer is currently marked <strong>{lead.status.replaceAll("_", " ").toLowerCase()}</strong>.
          </p>
        )}
      </div>
    </Container>
  );
}
