import {SELLERHQ_MAX_ATTEMPTS,sellerHqRetryPolicy} from "@/lib/sellerhq-retry-policy";
import {recordOperationalEvent} from "@/lib/server/operational-events";
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
  await db.from("sellerhq_retry_jobs").update({status:"dead_letter",last_error:"Retry limit exceeded",updated_at:now}).eq("status","failed").gte("attempts",SELLERHQ_MAX_ATTEMPTS);
  const { data: jobs, error } = await db.from("sellerhq_retry_jobs")
    .select("id,payload,attempts").in("status", ["pending", "failed"])
    .lte("retry_after", now).lt("attempts",SELLERHQ_MAX_ATTEMPTS).order("id").limit(20);
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
      const {attempts,terminal,delaySeconds,status}=sellerHqRetryPolicy(Number(job.attempts??0));
      const {error: failError} = await db.from("sellerhq_retry_jobs").update({
        status, attempts, retry_after:new Date(Date.now()+delaySeconds*1000).toISOString(),
        last_error:err instanceof Error ? err.message.slice(0,500) : "Unknown error",
        updated_at:new Date().toISOString()
      }).eq("id",job.id);
      if (failError) console.error("SellerHQ retry bookkeeping failed", failError);
      failed++;
      if(terminal) await recordOperationalEvent("sellerhq","error","delivery_dead_letter",{jobId:String(job.id),attempts});
    }
  }
  if(failed)await recordOperationalEvent("sellerhq","warning","retry_batch_failures",{failed,delivered});
  return {processed:delivered+failed,delivered,failed};
}
