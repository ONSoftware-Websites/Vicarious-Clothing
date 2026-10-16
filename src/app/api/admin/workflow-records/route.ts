import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getOrder, listLeads } from "@/lib/server/store";
import type { NextRequest } from "next/server";

const CATEGORIES=["note","inspection","intake","packing","return"] as const;
type Category=typeof CATEGORIES[number];
const CHECKLIST_KEYS:Record<Category,string[]>={
 note:[],inspection:["conditionVerified","photosChecked","discrepanciesResolved"],
 intake:["received","labelled","stockLinked"],
 packing:["itemsChecked","addressChecked","packagingChecked"],
 return:["requestReviewed","itemReceived","conditionChecked"],
};
const allowedForKind={lead:new Set<Category>(["note","inspection","intake"]),order:new Set<Category>(["note","packing","return"])};
async function authorize(request:NextRequest){
 const kind=request.nextUrl.searchParams.get("kind");
 const referenceId=request.nextUrl.searchParams.get("id")??"";
 if(kind!=="lead"&&kind!=="order") return {error:Response.json({error:"Invalid record type"},{status:400})};
 if(!referenceId||referenceId.length>150)return {error:Response.json({error:"Invalid reference"},{status:400})};
 const denied=await requireAdminApi(kind==="order"?"ADMIN":"MANAGER");
 if(denied)return {error:denied};
 const exists=kind==="order"?Boolean(await getOrder(referenceId)):(await listLeads()).some(x=>x.id===referenceId);
 if(!exists)return {error:Response.json({error:"Record not found"},{status:404})};
 return {kind,referenceId};
}
export async function GET(request:NextRequest){
 const a=await authorize(request);
 if(a.error)return a.error;
 const db=getSupabase();
 if(!db)return Response.json({error:"Database unavailable"},{status:503});
 const {data,error}=await db.from("workflow_records").select("id,category,note,checklist,created_at,actor_id")
 .eq("kind",a.kind).eq("reference_id",a.referenceId).order("created_at",{ascending:false}).limit(100);
 if(error)return Response.json({error:"Unable to retrieve workflow records"},{status:503});
 return Response.json({records:data??[]},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest){
 const a=await authorize(request);
 if(a.error)return a.error;
 let parsed:unknown;
 try{parsed=await request.json();}catch{return Response.json({error:"Invalid payload"},{status:400})}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return Response.json({error:"Invalid workflow entry"},{status:400});
 const body=parsed as Record<string,unknown>;
 const category=String(body.category??"") as Category;
 const note=typeof body.note==="string"?body.note.trim():"";
 if(!CATEGORIES.includes(category)||!allowedForKind[a.kind as "lead"|"order"].has(category)||note.length>4000)return Response.json({error:"Invalid workflow entry"},{status:400});
 const supplied=body.checklist;
 if(supplied!==undefined&&(!supplied||typeof supplied!=="object"||Array.isArray(supplied)))return Response.json({error:"Invalid checklist"},{status:400});
 const fields=(supplied??{}) as Record<string,unknown>;
 if(Object.keys(fields).some(key=>!CHECKLIST_KEYS[category].includes(key)||typeof fields[key]!=="boolean"))
   return Response.json({error:"Invalid checklist fields"},{status:400});
 if(!note&&!Object.keys(fields).length)return Response.json({error:"A note or checklist is required"},{status:400});
 const auth=await createSupabaseServer();
 if(!auth)return Response.json({error:"Authentication unavailable"},{status:503});
 const user=(await auth.auth.getUser()).data.user;
 if(!user)return Response.json({error:"Unauthenticated"},{status:401});
 const db=getSupabase();
 if(!db)return Response.json({error:"Database unavailable"},{status:503});
 const {data,error}=await db.from("workflow_records").insert({
 kind:a.kind,reference_id:a.referenceId,category,note,checklist:fields,actor_id:user.id
 }).select("id,created_at").single();
 if(error)return Response.json({error:"Unable to save workflow entry"},{status:503});
 return Response.json({ok:true,record:data},{status:201});
}
