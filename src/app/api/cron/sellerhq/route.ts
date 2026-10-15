import type { NextRequest } from "next/server";
import { processSellerHqRetries } from "@/lib/server/sellerhq-retry-worker";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({error:"Unauthorized"}, {status:401});
  }
  try { return Response.json(await processSellerHqRetries(), {headers:{"Cache-Control":"no-store"}}); }
  catch (error) { console.error(error); return Response.json({error:"Retry processing unavailable"}, {status:503}); }
}
