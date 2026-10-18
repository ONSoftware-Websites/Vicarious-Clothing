import { canSafelyCancelCheckoutIntent } from "@/lib/server/checkout-payment-state";
import { getSupabase } from "@/lib/server/supabase";
import { getStripe } from "@/lib/server/payments";
import { getOrder, markOrderPaid, setOrderPayment } from "@/lib/server/store";
import { recordOperationalEvent } from "@/lib/server/operational-events";
import { paymentIntentMatchesOrder } from "@/lib/server/stripe-payment-validation";

const CHECKOUT_WINDOW_MS = 45 * 60 * 1000;
type Row = { id:string; payment_intent_id:string|null; created_at:string };

// Only discard unpaid attempts after Stripe is known not to have captured money.
export async function reconcileAbandonedCheckouts() {
 const db=getSupabase(),stripe=getStripe();
 if(!db||!stripe) return {processed:0,discarded:0,unresolved:0,reason:"Payment reconciliation unavailable"};
 const deadline=new Date(Date.now()-CHECKOUT_WINDOW_MS).toISOString();
 const {data:attempts,error}=await db.from("orders")
   .select("id,payment_intent_id,created_at")
   .eq("status","PENDING_PAYMENT").lt("created_at",deadline)
   .order("created_at",{ascending:true}).limit(100);
 if(error)throw error;
 let discarded=0,unresolved=0,paidRecovered=0;
 for(const attempt of (attempts??[]) as Row[]){
   try{
     const {data:held,error:holdError}=await db.from("inventory_items")
       .select("checkout_hold_token").eq("checkout_hold_order_id",attempt.id);
     if(holdError)throw holdError;
     const tokens=[...new Set((held??[]).map(h=>h.checkout_hold_token).filter(Boolean))];
     if(tokens.length!==1){unresolved++;continue;}
     if(attempt.payment_intent_id){
       const intent=await stripe.paymentIntents.retrieve(attempt.payment_intent_id);
       if(intent.status==="succeeded") {
         const order=await getOrder(attempt.id);
         if(!order || !paymentIntentMatchesOrder(intent,order)){unresolved++;continue;}
         await setOrderPayment(order.id,intent.id);
         const paid=await markOrderPaid(order.id);
         if(!paid || paid.status!=="PAID"){unresolved++;continue;}
         paidRecovered++;
         // Signed Stripe webhook independently retries confirmations and sync.
         continue;
       }
       if(intent.status!=="canceled"){
         if(!canSafelyCancelCheckoutIntent(intent.status)){
           // Includes succeeded and processing: webhook is responsible for settlement/refund.
           unresolved++;continue;
         }
         await stripe.paymentIntents.cancel(intent.id);
       }
     }
     const {data:done,error:discardError}=await db.rpc("discard_unpaid_checkout",{
       p_order_id:attempt.id,p_hold_token:tokens[0]
     });
     if(discardError)throw discardError;
     if(done)discarded++;else unresolved++;
   }catch(error){console.error("Abandoned checkout reconciliation failed",{orderId:attempt.id,error});unresolved++;await recordOperationalEvent("cron","error","checkout_reconciliation_failed",{orderId:attempt.id,reason:error instanceof Error?error.message.slice(0,300):"Unknown error"});}
 }
 if(unresolved>0)await recordOperationalEvent("cron","warning","checkout_reconciliation_attention",{unresolved,processed:(attempts??[]).length});
 if(paidRecovered>0)await recordOperationalEvent("cron","info","checkout_payment_recovered",{count:paidRecovered});
 return {processed:(attempts??[]).length,discarded,unresolved};
}
