import type { NextRequest } from "next/server";
import { listEmails, listLeads, updateLeadStatus } from "@/lib/server/store";
import { verifyLeadAccessToken } from "@/lib/server/lead-access";

const OFFER_VALID_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = String(body.token ?? "");
    const decision = String(body.decision ?? "").toLowerCase();

    if (decision !== "accept" && decision !== "decline") {
      return Response.json({ error: "Invalid decision" }, { status: 400 });
    }

    const lead = (await listLeads()).find((entry) => entry.id === id);
    if (!lead || !verifyLeadAccessToken(lead.id, lead.email, token)) {
      return Response.json({ error: "This offer link is invalid." }, { status: 403 });
    }

    if (lead.status === "ACCEPTED" || lead.status === "DECLINED") {
      return Response.json({ ok: true, status: lead.status, unchanged: true });
    }
    if (lead.status !== "OFFER_SENT") {
      return Response.json({ error: "This offer is no longer awaiting a decision." }, { status: 409 });
    }

    const emails = await listEmails(200);
    const offerEmail = emails.find(
      (entry) =>
        entry.template === "lead-offer" &&
        entry.to.toLowerCase() === lead.email.toLowerCase() &&
        (entry.subject.includes(lead.id) || entry.preview.includes(lead.id))
    );
    if (offerEmail) {
      const sentAt = new Date(offerEmail.sentAt).getTime();
      if (Number.isFinite(sentAt) && sentAt + OFFER_VALID_MS < Date.now()) {
        return Response.json({ error: "This offer has expired." }, { status: 410 });
      }
    }

    const updated = await updateLeadStatus(
      lead.id,
      decision === "accept" ? "ACCEPTED" : "DECLINED"
    );
    if (!updated) return Response.json({ error: "Submission not found" }, { status: 404 });

    return Response.json({ ok: true, status: updated.status });
  } catch (error) {
    console.error("Lead decision failed:", error);
    return Response.json({ error: "Could not record your decision." }, { status: 500 });
  }
}
