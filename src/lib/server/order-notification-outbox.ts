import type { EmailTemplate } from "@/lib/server/mailer";
import { getSupabase } from "@/lib/server/supabase";
import { recordOperationalEvent } from "@/lib/server/operational-events";

const RETRYABLE = new Set<EmailTemplate>(["order-confirmed","order-dispatched","order-delivered","order-refunded","order-cancelled"]);

export async function queueOrderNotificationRetry(orderId:string,template:EmailTemplate,error?:unknown) {
 if(!RETRYABLE.has(template))return false;
 const db=getSupabase();if(!db)return false;
 const {error:dbError}=await db.from("order_notification_retries").upsert({
  order_id:orderId,template,status:"pending",retry_after:new Date().toISOString(),
  last_error:error instanceof Error?error.message.slice(0,400):"Notification delivery failed",
  updated_at:new Date().toISOString()
 },{onConflict:"order_id,template",ignoreDuplicates:true});
 if(dbError){console.error("Could not queue order notification",dbError);return false;}
 await recordOperationalEvent("email","warning","order_notification_retry_queued",{orderId,template});
 return true;
}
