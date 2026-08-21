import type { NextRequest } from "next/server";
import type { LeadStatus } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { createPurchase, updateLeadStatus } from "@/lib/server/store";
import { sendEmail } from "@/lib/server/mailer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { id } = await params;
  try {
    const body = await request.json();
    const status = String(body.status).toUpperCase() as LeadStatus;
    const offer = body.offer ? String(body.offer) : undefined;
    const lead = await updateLeadStatus(id, status, offer);
    if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

    if (status === "OFFER_SENT") {
      await sendEmail({
        to: lead.email,
        template: "lead-offer",
        data: { ...lead, offer: lead.offer ?? "an amount" },
      });
    }

    if (status === "ACCEPTED") {
      const amount = body.amount ? Number(body.amount) : undefined;
      if (amount && amount > 0) {
        await createPurchase(
          {
            sellerName: lead.name,
            sellerEmail: lead.email,
            amount,
            status: "AGREED",
            items: [],
            notes: `From sell-to-us lead: ${lead.brand} ${lead.itemType}, size ${lead.size} (${lead.condition}).`,
            leadId: lead.id,
          },
          "Henry"
        );
      }
    }

    return Response.json({ ok: true, lead });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
