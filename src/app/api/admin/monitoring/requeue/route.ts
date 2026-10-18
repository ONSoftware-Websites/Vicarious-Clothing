import {requireAdminApi} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
import {getSupabaseUser} from "@/lib/supabase/server";
import {recordOperationalEvent} from "@/lib/server/operational-events";
export async function POST(request:Request){
 const denied=await requireAdminApi("OWNER");if(denied)return denied;
 let body:unknown;
 try{body=await request.json()}catch{return Response.json({error:"Invalid payload"},{status:400});}
 const id=body&&typeof body==="object"&&"id" in body?(body as {id:unknown}).id:null;
 if(!Number.isSafeInteger(id)||Number(id)<=0)return Response.json({error:"Invalid job"},{status:400});
 const user=await getSupabaseUser(),db=getSupabase();
 if(!user||!db)return Response.json({error:"Service unavailable"},{status:503});
 const {data,error}=await db.from("sellerhq_retry_jobs")
 .update({status:"pending",attempts:0,retry_after:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()})
 .eq("id",id).eq("status","dead_letter").select("id").maybeSingle();
 if(error)return Response.json({error:"Retry could not be scheduled"},{status:503});
 if(!data)return Response.json({error:"Job was already recovered or its state changed"},{status:409});
 await recordOperationalEvent("sellerhq","warning","dead_letter_requeued",{jobId:String(id),actorId:user.id});
 return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
