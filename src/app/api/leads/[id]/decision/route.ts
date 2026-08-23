import type { NextRequest } from "next/server";
import {
  createPurchase,
  listEmails,
  listLeads,
  listPurchases,
  updateLeadStatus,
} from "@/lib/server/store";
import { verifyLeadAccessToken } from "@/lib/server/lead-access";
import { getSupabase } from "@/lib/server/supabase";

const OFFER_VALID_MS = 7 * 24 * 60 * 60 * 1000;

type OfferWindow = {
  offer_sent_at?: string | null;
  offer_expires_at?: string | null;
};

function offerAmount(value?: string) {
  if (!value) return undefined;
  const match = value.replace(/,/g, "").match(/£?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

async function offerHasExpired(lead: { id: string; email: string }) {
  const db = getSupabase();
  if (db) {
    const { data, error } = await db
      .from("purchase_leads")
      .select("offer_sent_at, offer_expires_at")
      .eq("id", lead.id)
      .maybeSingle();
    if (!error && data) {
      const row = data as OfferWindow;
      if (row.offer_expires_at) {
        const expires = new Date(row.offer_expires_at).getTime();
        return Number.isFinite(expires) && expires < Date.now();
      }
      if (row.offer_sent_at) {
        const sent = new Date(row.offer_sent_at).getTime();
        return Number.isFinite(sent) && sent + OFFER_VALID_MS < Date.now();
      }
    }
  }

  const emails = await listEmails(200);
  const offerEmail = emails.find(
    (entry) =>
      entry.template === "lead-offer" &&
      entry.to.toLowerCase() === lead.email.toLowerCase() &&
      (entry.subject.includes(lead.id) || entry.preview.includes(lead.id))
  );
  if (!offerEmail) return false;
  const sentAt = new Date(offerEmail.sentAt).getTime();
  return Number.isFinite(sentAt) && sentAt + OFFER_VALID_MS < Date.now();
}

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

    if (await offerHasExpired(lead)) {
      return Response.json({ error: "This offer has expired." }, { status: 410 });
    }

    const updated = await updateLeadStatus(
      lead.id,
      decision === "accept" ? "ACCEPTED" : "DECLINED"
    );
    if (!updated) return Response.json({ error: "Submission not found" }, { status: 404 });

    if (updated.status === "ACCEPTED") {
      const amount = offerAmount(updated.offer);
      const purchaseExists = (await listPurchases()).some(
        (purchase) => purchase.leadId === updated.id
      );
      if (amount && !purchaseExists) {
        await createPurchase(
          {
            sellerName: updated.name,
            sellerEmail: updated.email,
            amount,
            status: "AGREED",
            items: [],
            notes: `Accepted sell-to-us offer: ${updated.brand} ${updated.itemType}, size ${updated.size} (${updated.condition}).`,
            leadId: updated.id,
          },
          "customer"
        );
      }
    }

    return Response.json({ ok: true, status: updated.status });
  } catch (error) {
    console.error("Lead decision failed:", error);
    return Response.json({ error: "Could not record your decision." }, { status: 500 });
  }
}
