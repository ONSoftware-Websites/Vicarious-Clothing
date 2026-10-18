import {requireAdminApi} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
import {getSupabaseUser} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await requireAdminApi("OWNER");if(denied)return denied;
 const db=getSupabase();
 if(!db)return Response.json({error:"Database unavailable"},{status:503});
 const {data,error}=await db.from("storefront_controls").select("maintenance_enabled,updated_at").eq("id",1).single();
 if(error)return Response.json({error:"Unable to read maintenance status"},{status:503});
 return Response.json({enabled:data.maintenance_enabled,updatedAt:data.updated_at},{headers:{"Cache-Control":"no-store"}});
}
export async function PATCH(request:Request){
 const denied=await requireAdminApi("OWNER");if(denied)return denied;
 let data:unknown;
 try{data=await request.json()}catch{return Response.json({error:"Invalid request"},{status:400});}
 if(!data||typeof data!=="object"||Array.isArray(data)||typeof (data as {enabled?:unknown}).enabled!=="boolean")
   return Response.json({error:"Specify enabled as true or false"},{status:400});
 const enabled=(data as {enabled:boolean}).enabled;
 const db=getSupabase();const user=await getSupabaseUser();
 if(!db||!user)return Response.json({error:"Maintenance service unavailable"},{status:503});
 const {data:updated,error}=await db.from("storefront_controls")
   .update({maintenance_enabled:enabled,updated_at:new Date().toISOString(),updated_by:user.id})
   .eq("id",1).select("maintenance_enabled,updated_at").single();
 if(error)return Response.json({error:"Unable to change maintenance status"},{status:503});
 const {error:auditError}=await db.from("audit_logs").insert({
  id:crypto.randomUUID(),actor:user.email??user.id,action:enabled?"Maintenance enabled":"Maintenance disabled",
  detail:"Storefront maintenance switch",at:new Date().toISOString()
 });
 if(auditError)console.error("Maintenance audit record failed",auditError);
 return Response.json({enabled:updated.maintenance_enabled,updatedAt:updated.updated_at},{headers:{"Cache-Control":"no-store"}});
}
