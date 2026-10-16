import { getSupabase } from "@/lib/server/supabase";
import { listLeads, updateLeadStatus } from "@/lib/server/store";
import type { LeadStatus } from "@/lib/types";

/** Compare-and-set on the current status prevents simultaneous seller/admin decisions. */
export async function transitionLeadStatus(
  id: string,
  expected: LeadStatus,
  next: LeadStatus,
  offer?: string
) {
  const db = getSupabase();
  if (!db) {
    // Development/local fallback; production requires the database.
    const current = (await listLeads()).find(lead => lead.id === id);
    if (!current || current.status !== expected) return undefined;
    return updateLeadStatus(id,next,offer);
  }
  const updates: {status:LeadStatus;offer?:string} = {status:next};
  if (offer !== undefined) updates.offer=offer;
  const {data,error} = await db.from("purchase_leads")
    .update(updates).eq("id",id).eq("status",expected).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return (await listLeads()).find(lead=>lead.id===id);
}
