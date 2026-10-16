import type {NextRequest} from "next/server";
import {requireAdminApi} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
import {getSupabaseUser} from "@/lib/supabase/server";
import {getOrder} from "@/lib/server/store";
import {FINANCE_KINDS} from "@/lib/finance-report";

export async function POST(req:NextRequest){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 let parsed:unknown;
 try{parsed=await req.json()}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return Response.json({error:"Invalid entry"},{status:400});
 const input=parsed as Record<string,unknown>;
 const kind=input.kind,amount=input.amount,reference=input.reference,description=input.description,occurredAt=input.occurredAt,orderId=input.orderId;
 if(typeof kind!=="string"||!FINANCE_KINDS.includes(kind as typeof FINANCE_KINDS[number])||
    typeof amount!=="number"||!Number.isFinite(amount)||amount<=0||amount>1000000||
    Math.round(amount*100)!==amount*100||
    typeof reference!=="string"||reference.trim().length<3||reference.trim().length>140||
    (description!==undefined&&(typeof description!=="string"||description.length>1000))||
    typeof occurredAt!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)||Number.isNaN(Date.parse(occurredAt))||
    (orderId!==undefined&&orderId!==null&&typeof orderId!=="string"))
  return Response.json({error:"Check the type, GBP amount, reference and date"},{status:400});
 const linked=typeof orderId==="string"?orderId.trim().toUpperCase():null;
 if(kind==="refund"&&!linked)return Response.json({error:"A refund must reference an order"},{status:400});
 if(linked&&!(await getOrder(linked)))return Response.json({error:"Order not found"},{status:404});
 const db=getSupabase(),user=await getSupabaseUser();
 if(!db||!user)return Response.json({error:"Finance service unavailable"},{status:503});
 const {data,error}=await db.from("finance_adjustments").insert({
 kind,amount,order_id:linked,reference:reference.trim(),description:typeof description==="string"?description.trim():"",
 occurred_at:occurredAt,actor_id:user.id
 }).select("id").single();
 if(error){if(error.code==="23505")return Response.json({error:"This category and reference has already been recorded"},{status:409});
 return Response.json({error:"Could not record adjustment"},{status:503});}
 return Response.json({ok:true,id:data.id},{status:201});
}
