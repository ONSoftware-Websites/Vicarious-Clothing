import { getSupabase } from "@/lib/server/supabase";
import { getStripe } from "@/lib/server/payments";
import { recordOperationalEvent } from "@/lib/server/operational-events";

// Read-only financial checks; no charge, refund or order mutation.
export async function auditStripeOrderReconciliation(limit=30) {
 const db=getSupabase(),stripe=getStripe();
 if(!db||!stripe)return {checked:0,exceptions:0,unavailable:true};
 const {data:orders,error}=await db.from("orders").select("id,status,total,payment_intent_id")
 .not("payment_intent_id","is",null).order("created_at",{ascending:false}).limit(limit);
 if(error)throw error;
 let checked=0,exceptions=0;
 for(const order of orders??[]){
  try{
   const intent=await stripe.paymentIntents.retrieve(order.payment_intent_id);
   checked++;
   const amountMatches=intent.amount===Math.round(Number(order.total)*100)&&intent.currency==="gbp";
   const paidState=["PAID","PICKING","READY_TO_DISPATCH","DISPATCHED","DELIVERED","RETURN_REQUESTED","RETURNED"].includes(order.status);
   const inconsistent=!amountMatches||(paidState&&intent.status!=="succeeded");
   if(inconsistent){
    exceptions++;
    await recordOperationalEvent("cron","error","payment_order_discrepancy",{
     orderId:order.id,orderStatus:order.status,paymentStatus:intent.status,amountMatches
    });
   }
  }catch(e){
   exceptions++;
   await recordOperationalEvent("cron","warning","payment_audit_unavailable",{
    orderId:order.id,reason:e instanceof Error?e.message.slice(0,150):"Stripe lookup failed"
   });
  }
 }
 return {checked,exceptions,unavailable:false};
}
