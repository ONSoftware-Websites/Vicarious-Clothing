import {requireAdminApi} from "@/lib/server/admin-auth";
import {getSupabase} from "@/lib/server/supabase";
function cell(v:unknown){
 const str=String(v??"").replace(/^[\s]*[=+@-]/,"' $&");
 return `"${str.replaceAll('"','""')}"`;
}
export async function GET(){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 const db=getSupabase();
 if(!db)return Response.json({error:"Database unavailable"},{status:503});
 const {data,error}=await db.from("finance_adjustments")
  .select("occurred_at,kind,amount,order_id,reference,description,created_at")
  .order("occurred_at",{ascending:false}).limit(10000);
 if(error)return Response.json({error:"Finance export unavailable"},{status:503});
 if((data??[]).length>=10000)return Response.json({error:"Ledger exceeds export limit; use a date-restricted database export"},{status:409});
 const header=["Date","Type","GBP amount","Order ID","Reference","Description","Recorded at"];
 const csv=[header,...(data??[]).map(row=>[
  row.occurred_at,row.kind,row.amount,row.order_id,row.reference,row.description,row.created_at
 ])].map(row=>row.map(cell).join(",")).join("\r\n");
 return new Response("\ufeff"+csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="vicarious-finance-adjustments.csv"',"Cache-Control":"no-store"}});
}
