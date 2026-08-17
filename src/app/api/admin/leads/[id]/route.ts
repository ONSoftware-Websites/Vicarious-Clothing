import type { NextRequest } from "next/server";
import type { LeadStatus } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { updateLeadStatus } from "@/lib/server/store";
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
    const lead = updateLeadStatus(id, status, offer);
    if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

    if (status === "OFFER_SENT") {
      await sendEmail({
        to: lead.email,
        template: "lead-offer",
        data: { ...lead, offer: lead.offer ?? "an amount" },
      });
    }

    return Response.json({ ok: true, lead });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
