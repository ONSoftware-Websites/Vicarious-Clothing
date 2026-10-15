import { requireAdminApi } from "@/lib/server/admin-auth";
import { processSellerHqRetries } from "@/lib/server/sellerhq-retry-worker";
export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try { return Response.json(await processSellerHqRetries()); }
  catch (error) { console.error(error); return Response.json({error:"Retry processing unavailable"}, {status:503}); }
}
