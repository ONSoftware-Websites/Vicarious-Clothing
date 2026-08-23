import type { NextRequest } from "next/server";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import {
  createPurchase,
  deleteLead,
  listLeads,
  listPurchases,
  updateLeadStatus,
} from "@/lib/server/store";
import { sendEmail } from "@/lib/server/mailer";
import { getSupabase } from "@/lib/server/supabase";

const OFFER_VALID_MS = 7 * 24 * 60 * 60 * 1000;
const ACTOR = "Admin";

function offerAmount(value: string | undefined) {
  if (!value) return undefined;
  const match = value.replace(/,/g, "").match(/£?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

async function markOfferWindow(leadId: string) {
  const db = getSupabase();
  if (!db) return;
  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OFFER_VALID_MS);
  const { error } = await db
    .from("purchase_leads")
    .update({
      offer_sent_at: sentAt.toISOString(),
      offer_expires_at: expiresAt.toISOString(),
    })
    .eq("id", leadId);
  if (error) {
    console.warn("Could not write offer expiry metadata:", error.message);
  }
}

async function ensurePurchaseForAcceptedLead(lead: Awaited<ReturnType<typeof updateLeadStatus>>) {
  if (!lead) return;
  const amount = offerAmount(lead.offer);
  if (!amount) return;
  const existing = (await listPurchases()).find((purchase) => purchase.leadId === lead.id);
  if (existing) return;

  await createPurchase(
    {
      sellerName: lead.name,
      sellerEmail: lead.email,
      amount,
      status: "AGREED",
      items: [],
      notes: `Accepted sell-to-us offer: ${lead.brand} ${lead.itemType}, size ${lead.size} (${lead.condition}).`,
      leadId: lead.id,
    },
    ACTOR
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { id } = await params;
  try {
    const body = await request.json();
    const status = String(body.status ?? "").toUpperCase() as LeadStatus;
    if (!LEAD_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid lead status" }, { status: 400 });
    }

    const current = (await listLeads()).find((lead) => lead.id === id);
    if (!current) return Response.json({ error: "Not found" }, { status: 404 });

    const offer = body.offer ? String(body.offer).trim() : current.offer;
    if (status === "OFFER_SENT") {
      if (!offer) {
        return Response.json({ error: "Enter an offer before sending it." }, { status: 400 });
      }

      await sendEmail({
        to: current.email,
        template: "lead-offer",
        data: { ...current, status: "OFFER_SENT", offer, offerExpiry: "7 days" },
      });
    }

    const lead = await updateLeadStatus(id, status, offer);
    if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

    if (status === "OFFER_SENT") {
      await markOfferWindow(lead.id);
    }

    if (status === "ACCEPTED") {
      await ensurePurchaseForAcceptedLead(lead);
    }

    return Response.json({ ok: true, lead });
  } catch (error) {
    console.error("Lead update failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Lead update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  const { id } = await params;
  await deleteLead(id, ACTOR);
  return Response.json({ ok: true });
}
