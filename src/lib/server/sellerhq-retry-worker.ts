import { getSupabase } from "@/lib/server/supabase";

export async function processSellerHqRetries() {
  const db = getSupabase();
  const url = process.env.SELLERHQ_VICARIOUS_LINK_URL;
  const key = process.env.SELLERHQ_API_KEY;
  if (!db || !url || !key) throw new Error("SellerHQ integration is not configured");
  const now = new Date().toISOString();
  const { error: leaseError } = await db.from("sellerhq_retry_jobs")
    .update({status:"failed",retry_after:now,last_error:"Worker lease expired"})
    .eq("status","processing")
    .lt("updated_at",new Date(Date.now()-3*60*1000).toISOString());
  if (leaseError) throw leaseError;
  const { data: jobs, error } = await db.from("sellerhq_retry_jobs")
    .select("id,payload,attempts").in("status", ["pending", "failed"])
    .lte("retry_after", now).order("id").limit(20);
  if (error) throw error;
  let delivered = 0, failed = 0;
  for (const job of jobs ?? []) {
    const { data: claimed, error: claimError } = await db.from("sellerhq_retry_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", job.id).in("status", ["pending","failed"])
      .select("id").maybeSingle();
    if (claimError || !claimed) continue;
    try {
      const response = await fetch(url, { method: "POST", headers: {
        "Content-Type": "application/json", "X-Vicarious-Api-Key": key
      }, body: JSON.stringify(job.payload), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`SellerHQ returned ${response.status}`);
      const { error: doneError } = await db.from("sellerhq_retry_jobs")
        .update({status:"done",updated_at:new Date().toISOString(),last_error:null})
        .eq("id",job.id);
      if (doneError) throw doneError;
      delivered++;
    } catch (err) {
      const attempts = Number(job.attempts ?? 0) + 1;
      const delay = Math.min(3600, 30 * 2 ** Math.min(attempts, 7));
      const {error: failError} = await db.from("sellerhq_retry_jobs").update({
        status:"failed", attempts, retry_after:new Date(Date.now()+delay*1000).toISOString(),
        last_error:err instanceof Error ? err.message.slice(0,500) : "Unknown error",
        updated_at:new Date().toISOString()
      }).eq("id",job.id);
      if (failError) console.error("SellerHQ retry bookkeeping failed", failError);
      failed++;
    }
  }
  return {processed:delivered+failed,delivered,failed};
}
