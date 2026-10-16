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
  const {data:expired,error:expiryError} = await db.rpc("expire_checkout_holds");
  if (expiryError) {
    console.error("Expired checkout cleanup failed",expiryError);
    return Response.json({error:"Checkout cleanup unavailable"}, {status:503});
  }
  try {
    const sellerHq = await processSellerHqRetries();
    return Response.json({expiredCheckoutHolds:expired,sellerHq},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    console.error("SellerHQ retry failed",error);
    return Response.json({error:"SellerHQ retry unavailable",expiredCheckoutHolds:expired},{status:503});
  }
}
