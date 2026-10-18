import { getSupabase } from "@/lib/server/supabase";
import { getOrder } from "@/lib/server/store";
import { sendEmail, type EmailTemplate } from "@/lib/server/mailer";
import { recordOperationalEvent } from "@/lib/server/operational-events";

const STATUS_FOR_TEMPLATE: Record<string,string[]> = {
 "order-confirmed":["PAID","PICKING","READY_TO_DISPATCH","DISPATCHED","DELIVERED","RETURN_REQUESTED","RETURNED","REFUNDED"],
 "order-dispatched":["DISPATCHED","DELIVERED","RETURN_REQUESTED","RETURNED","REFUNDED"],
 "order-delivered":["DELIVERED","RETURN_REQUESTED","RETURNED","REFUNDED"],
 "order-refunded":["REFUNDED"],
 "order-cancelled":["CANCELLED"]
};
export async function processOrderNotificationRetries() {
 const db=getSupabase();if(!db)throw new Error("Notification outbox database unavailable");
 const now=new Date().toISOString();
 const {data:jobs,error}=await db.from("order_notification_retries")
  .select("id,order_id,template,attempts").in("status",["pending","failed"])
  .lte("retry_after",now).lt("attempts",5).order("id").limit(15);
 if(error)throw error;
 let sent=0,failed=0,skipped=0;
 for(const job of jobs??[]){
  const {data:claim,error:claimError}=await db.from("order_notification_retries")
   .update({status:"processing",updated_at:now})
   .eq("id",job.id).in("status",["pending","failed"]).select("id").maybeSingle();
  if(claimError||!claim)continue;
  try{
   const order=await getOrder(job.order_id);
   const accepted=STATUS_FOR_TEMPLATE[job.template]??[];
   if(!order||!accepted.includes(order.status)){
    await db.from("order_notification_retries").update({status:"dead_letter",last_error:"Order no longer matches message lifecycle",updated_at:new Date().toISOString()}).eq("id",job.id);
    skipped++;continue;
   }
   if(job.template==="order-refunded"||job.template==="order-cancelled"){
    // These templates require verified financial/cancellation context.
    // Manual review avoids inaccurate duplicate financial notifications.
    await db.from("order_notification_retries").update({status:"dead_letter",last_error:"Financial notification requires manual review",updated_at:new Date().toISOString()}).eq("id",job.id);
    skipped++;continue;
   }
   await sendEmail({to:order.email,template:job.template as EmailTemplate,data:{order}});
   const {error:doneError}=await db.from("order_notification_retries").update({status:"done",updated_at:new Date().toISOString(),last_error:null}).eq("id",job.id);
   if(doneError)throw doneError;
   sent++;
  }catch(e){
   const attempts=Number(job.attempts||0)+1;
   const {error:failedError}=await db.from("order_notification_retries").update({
    attempts,status:attempts>=5?"dead_letter":"failed",retry_after:new Date(Date.now()+Math.min(3600000,Math.pow(2,attempts)*60000)).toISOString(),
    last_error:e instanceof Error?e.message.slice(0,400):"Delivery failed",updated_at:new Date().toISOString()
   }).eq("id",job.id);
   if(failedError)console.error("Notification retry bookkeeping failed",failedError);
   failed++;
  }
 }
 if(failed||skipped)await recordOperationalEvent("email","warning","notification_retry_exceptions",{failed,skipped,sent});
 return {processed:sent+failed+skipped,sent,failed,skipped};
}
