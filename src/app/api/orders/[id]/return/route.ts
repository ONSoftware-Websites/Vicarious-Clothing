import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getOrder } from "@/lib/server/store";
import { getSupabaseUser } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/server/supabase";
import { orderAccessCookieName,verifyOrderAccessToken } from "@/lib/server/order-access";

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const order=await getOrder(id);
 if(!order)return Response.json({error:"Order not found"},{status:404});
 const user=await getSupabaseUser();
 const token=(await cookies()).get(orderAccessCookieName(order.id))?.value??"";
 const accountAccess=Boolean(user?.email)&&user!.email!.toLowerCase()===order.email.toLowerCase();
 const guestAccess=verifyOrderAccessToken(order.id,order.email,token);
 if(!accountAccess&&!guestAccess)return Response.json({error:"You cannot access this order"},{status:403});
 if(!["DISPATCHED","DELIVERED"].includes(order.status))
   return Response.json({error:"This order cannot currently enter a new return request"},{status:409});
 let payload:unknown;
 try{payload=await request.json()}catch{return Response.json({error:"Invalid request"},{status:400})}
 const reason=payload&&typeof payload==="object"&&"reason" in payload&&typeof payload.reason==="string"?payload.reason.trim():"";
 if(reason.length<10||reason.length>2000)return Response.json({error:"Please explain the return in 10–2000 characters"},{status:400});
 const db=getSupabase();
 if(!db)return Response.json({error:"Returns service unavailable"},{status:503});
 const {data,error}=await db.rpc("create_customer_return_request",{p_order_id:order.id,p_reason:reason});
 if(error){console.error("Customer return intake failed:",error);return Response.json({error:"We could not record the return request"},{status:503});}
 if(!data)return Response.json({error:"Return request already processed or order status changed"},{status:409});
 return Response.json({ok:true,status:"RETURN_REQUESTED"},{headers:{"Cache-Control":"no-store"}});
}
