import {requireAdminApi} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
import {getSupabaseUser} from "@/lib/supabase/server";
import {getOrder} from "@/lib/server/store";
import {getStripe} from "@/lib/server/payments";

export async function POST(request:Request){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 let input:unknown;
 try{input=await request.json()}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 const raw=input&&typeof input==="object"&&!Array.isArray(input)?(input as Record<string,unknown>).orderId:null;
 if(typeof raw!=="string"||!raw.trim()||raw.length>140)
  return Response.json({error:"Enter an order reference"},{status:400});
 const order=await getOrder(raw.trim().toUpperCase());
 if(!order)return Response.json({error:"Order not found"},{status:404});
 if(order.paymentProvider!=="stripe"||!order.paymentIntentId)
  return Response.json({error:"Only Stripe orders with a linked PaymentIntent can be reconciled"},{status:409});
 const stripe=getStripe(),db=getSupabase(),user=await getSupabaseUser();
 if(!stripe||!db||!user)return Response.json({error:"Reconciliation service unavailable"},{status:503});
 try{
  const intent=await stripe.paymentIntents.retrieve(order.paymentIntentId);
  if(intent.id!==order.paymentIntentId||intent.currency!=="gbp"||intent.metadata?.orderId!==order.id)
   return Response.json({error:"Stripe payment association mismatch"},{status:409});
  const refunds=await stripe.refunds.list({payment_intent:intent.id,limit:100});
  if(refunds.has_more)return Response.json({error:"Too many refunds to reconcile in one operation; contact support"},{status:409});
  const charges=await stripe.charges.list({payment_intent:intent.id,limit:100});
  if(charges.has_more)return Response.json({error:"Too many charges to reconcile in one operation"},{status:409});
  const {data:existing,error:readError}=await db.from("finance_adjustments")
   .select("kind,reference").eq("order_id",order.id).eq("kind","refund");
  if(readError)return Response.json({error:"Cannot verify existing refund entries"},{status:503});
  if((existing??[]).some(e=>!e.reference.startsWith("stripe-refund:")))
   return Response.json({error:"Manual refund entries exist for this order. Reconcile these before importing automatic Stripe refunds to avoid double-counting."},{status:409});
  const additions:{kind:"fee"|"refund";amount:number;order_id:string;reference:string;description:string;occurred_at:string;actor_id:string}[]=[];
  for(const charge of charges.data){
   if(!charge.paid||!charge.captured||charge.currency!=="gbp"||!charge.balance_transaction)continue;
   const transaction=typeof charge.balance_transaction==="string"?
     await stripe.balanceTransactions.retrieve(charge.balance_transaction):charge.balance_transaction;
   if(transaction.currency!=="gbp")continue;
   if(transaction.fee>0)additions.push({kind:"fee",amount:transaction.fee/100,order_id:order.id,
     reference:`stripe-fee:${transaction.id}`,description:`Stripe processor fee for ${charge.id}`,
     occurred_at:new Date(transaction.created*1000).toISOString().slice(0,10),actor_id:user.id});
  }
  for(const refund of refunds.data){
   if(refund.status!=="succeeded"||refund.currency!=="gbp"||refund.amount<=0)continue;
   additions.push({kind:"refund",amount:refund.amount/100,order_id:order.id,
    reference:`stripe-refund:${refund.id}`,description:`Verified Stripe refund ${refund.id}`,
    occurred_at:new Date(refund.created*1000).toISOString().slice(0,10),actor_id:user.id});
  }
  if(additions.length){
   const {error}=await db.from("finance_adjustments").upsert(additions,{onConflict:"kind,reference",ignoreDuplicates:true});
   if(error){console.error("Stripe reconciliation insert failed",error);return Response.json({error:"Could not record Stripe reconciliation"},{status:503});}
  }
  return Response.json({ok:true,charges:charges.data.length,refunds:refunds.data.filter(x=>x.status==="succeeded").length,entriesChecked:additions.length});
 }catch(err){
  console.error("Stripe finance reconciliation failed",err);
  return Response.json({error:"Stripe data could not be reconciled"},{status:503});
 }
}
