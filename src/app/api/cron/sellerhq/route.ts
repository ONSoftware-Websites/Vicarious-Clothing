import { processOrderNotificationRetries } from "@/lib/server/order-notification-retry-worker";
import {reconcileAbandonedCheckouts} from "@/lib/server/abandoned-checkout-reconciliation";
import {recordOperationalEvent} from "@/lib/server/operational-events";
import type { NextRequest } from "next/server";
import { processSellerHqRetries } from "@/lib/server/sellerhq-retry-worker";
import { getSupabase } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({error:"Unauthorized"}, {status:401});

  // A single existing once-daily cron performs checkout recovery and SellerHQ retries.
  const db = getSupabase();
  if (!db) return Response.json({error:"Database unavailable"}, {status:503});
  await recordOperationalEvent("cron","info","daily_job_started");
  const {data:expired,error:expiryError} = await db.rpc("expire_checkout_holds");
  if (expiryError) {
    console.error("Expired checkout cleanup failed",expiryError);
    await recordOperationalEvent("cron","error","checkout_expiry_failed");
    return Response.json({error:"Checkout cleanup unavailable"}, {status:503});
  }
  try {
    const checkout = await reconcileAbandonedCheckouts();
    const sellerHq = await processSellerHqRetries();
    const notifications = await processOrderNotificationRetries();
    await recordOperationalEvent("cron",sellerHq.failed?"warning":"info","daily_job_completed",{expiredCheckoutHolds:Number(expired??0),processed:sellerHq.processed,delivered:sellerHq.delivered,failed:sellerHq.failed,checkoutProcessed:checkout.processed,checkoutDiscarded:checkout.discarded,checkoutUnresolved:checkout.unresolved,notificationsSent:notifications.sent,notificationsFailed:notifications.failed});
    return Response.json({expiredCheckoutHolds:expired,checkout,sellerHq,notifications},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    console.error("SellerHQ retry failed",error);
    await recordOperationalEvent("cron","error","daily_job_failed");
    return Response.json({error:"SellerHQ retry unavailable",expiredCheckoutHolds:expired},{status:503});
  }
}
