import {getSupabase} from "@/lib/server/supabase";
import type {FinanceAdjustment} from "@/lib/finance-report";

/** Fetch all supported ledger records; never silently report incomplete aggregates. */
export async function getFinanceEntries():Promise<FinanceAdjustment[]>{
 const db=getSupabase();
 if(!db)throw new Error("Finance database unavailable");
 const entries:FinanceAdjustment[]=[];
 const batch=500,maxEntries=20000;
 for(let offset=0;offset<=maxEntries;offset+=batch){
  const {data,error}=await db.from("finance_adjustments")
   .select("id,kind,amount,order_id,reference,description,occurred_at,created_at")
   .order("created_at",{ascending:true}).order("id",{ascending:true})
   .range(offset,offset+batch-1);
  if(error)throw new Error("Finance ledger query failed");
  for(const row of data??[])entries.push({...row,amount:Number(row.amount)} as FinanceAdjustment);
  if((data??[]).length<batch)return entries;
 }
 throw new Error("Finance ledger is larger than the supported reporting limit; use a paginated accounting export");
}
