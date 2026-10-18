import { getSupabase } from "@/lib/server/supabase";
import { getOrder } from "@/lib/server/store";
import { getStripe } from "@/lib/server/payments";
import { readCheckoutHoldToken } from "@/lib/server/checkout-hold";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Reattach the same browser to a still-payable checkout, without creating a new order.
export async function GET() {
 try {
  const token=await readCheckoutHoldToken();
  if(!token)return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  const db=getSupabase(),stripe=getStripe();
  if(!db||!stripe)return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  const {data:rows,error}=await db.from("inventory_items")
   .select("checkout_hold_order_id,sku").eq("checkout_hold_token",token)
   .not("checkout_hold_order_id","is",null);
  if(error)throw error;
  const orderIds=[...new Set((rows??[]).map(row=>row.checkout_hold_order_id).filter(Boolean))];
  if(orderIds.length!==1)return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  const order=await getOrder(String(orderIds[0]));
  if(!order||order.status!=="PENDING_PAYMENT"||!order.paymentIntentId)
    return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  if(order.items.length!==rows?.length || !order.items.every(item=>rows?.some(row=>row.sku===item.sku)))
    return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  const intent=await stripe.paymentIntents.retrieve(order.paymentIntentId);
  if(!["requires_payment_method","requires_confirmation","requires_action"].includes(intent.status) || !intent.client_secret)
    return NextResponse.json({resumable:false},{headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({resumable:true,order,clientSecret:intent.client_secret,holdToken:token,
    expiresAt:new Date(Date.parse(order.createdAt)+45*60_000).toISOString()
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  console.error("Checkout resume failed",e);
  return NextResponse.json({resumable:false,error:"Resume unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
