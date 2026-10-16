import { getSupabase } from "@/lib/server/supabase";
export type GateCategory="inspection"|"intake"|"packing"|"return";
export const REQUIRED_CHECKS:Record<GateCategory,string[]>={
 inspection:["conditionVerified","photosChecked","discrepanciesResolved"],
 intake:["received","labelled","stockLinked"],
 packing:["itemsChecked","addressChecked","packagingChecked"],
 return:["requestReviewed","itemReceived","conditionChecked"],
};
export async function completedWorkflowChecklist(kind:"lead"|"order",referenceId:string,category:GateCategory){
 const db=getSupabase();
 if(!db)return false;
 const {data,error}=await db.from("workflow_records").select("checklist")
  .eq("kind",kind).eq("reference_id",referenceId).eq("category",category)
  .order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(error)throw new Error("Unable to confirm required workflow checks");
 if(!data)return false;
 const checklist=data.checklist as Record<string,unknown>;
 return REQUIRED_CHECKS[category].every(key=>checklist?.[key]===true);
}
