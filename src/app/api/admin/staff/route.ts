import { createSupabaseServer } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";
import { requireRole } from "@/lib/server/admin-auth";
const allowed=new Set(["STAFF","MANAGER","ADMIN","OWNER","SUPER_ADMIN"]);
export async function PATCH(request:Request){
 if(!(await requireRole("SUPER_ADMIN"))) return Response.json({error:"Forbidden"},{status:403});
 const auth=await createSupabaseServer(); const db=getSupabase();
 if(!auth||!db)return Response.json({error:"Service unavailable"},{status:503});
 const {data:{user}}=await auth.auth.getUser();
 if(!user)return Response.json({error:"Unauthorized"},{status:401});
 let input:unknown;
 try{input=await request.json();}catch{return Response.json({error:"Invalid request"},{status:400});}
 if(!input||typeof input!=="object")return Response.json({error:"Invalid request"},{status:400});
 const value=input as Record<string,unknown>;
 const userId=value.userId,role=value.role,active=value.active;
 if(typeof userId!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)||typeof role!=="string"||!allowed.has(role)||typeof active!=="boolean")
  return Response.json({error:"Invalid membership"},{status:400});
 if(userId===user.id && (role!=="SUPER_ADMIN"||!active))
  return Response.json({error:"You cannot remove your own Super-admin access"},{status:409});
 const {data:target,error:readError}=await db.from("admin_staff").select("role,active").eq("user_id",userId).maybeSingle();
 if(readError||!target)return Response.json({error:"Staff membership unavailable"},{status:404});
 if(target.role==="SUPER_ADMIN" && (role!=="SUPER_ADMIN"||!active)){
  const {count,error}=await db.from("admin_staff").select("user_id",{head:true,count:"exact"}).eq("role","SUPER_ADMIN").eq("active",true);
  if(error||!count||count<=1)return Response.json({error:"Cannot disable the last Super-admin"},{status:409});
 }
 const {error}=await db.from("admin_staff").update({role,active}).eq("user_id",userId);
 if(error)return Response.json({error:"Unable to save membership"},{status:503});
 return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
