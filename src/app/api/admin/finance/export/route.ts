import {getFinanceEntries} from "@/lib/server/finance-data";
import {requireAdminApi} from "@/lib/server/admin-auth";
function cell(v:unknown){
 const str=String(v??"").replace(/^[\s]*[=+@-]/,"' $&");
 return `"${str.replaceAll('"','""')}"`;
}
export async function GET(){
 const denied=await requireAdminApi("ADMIN");if(denied)return denied;
 const data=await getFinanceEntries();
 const header=["Date","Type","GBP amount","Order ID","Reference","Description","Recorded at"];
 const csv=[header,...data.map(row=>[
  row.occurred_at,row.kind,row.amount,row.order_id,row.reference,row.description,row.created_at
 ])].map(row=>row.map(cell).join(",")).join("\r\n");
 return new Response("\ufeff"+csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="vicarious-finance-adjustments.csv"',"Cache-Control":"no-store"}});
}
