import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";
export const dynamic = "force-dynamic";

// Only an already-provisioned staff account may begin MFA enrolment.
export async function GET() {
  const auth = await createSupabaseServer();
  const db = getSupabase();
  if (!auth || !db) return Response.json({error:"Authentication unavailable"}, {status:503});
  const {data:{user},error} = await auth.auth.getUser();
  if (error || !user || !user.email_confirmed_at)
    return Response.json({error:"Unauthorised"}, {status:403});
  const {data:staff,error:lookupError} = await db.from("admin_staff")
    .select("active").eq("user_id",user.id).maybeSingle();
  if (lookupError) return Response.json({error:"Authorisation unavailable"}, {status:503});
  if (!staff?.active) return Response.json({error:"Unauthorised"}, {status:403});
  return Response.json({ok:true}, {headers:{"Cache-Control":"no-store"}});
}
