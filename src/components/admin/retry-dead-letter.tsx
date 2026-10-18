"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function RetryDeadLetter({id}:{id:number}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const recover=async()=>{
  if(!window.confirm("Requeue this SellerHQ delivery? Ensure the external problem has been resolved. The remote system must handle duplicate event keys safely."))return;
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/admin/monitoring/requeue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error??"Could not requeue");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Recovery failed");}
  finally{setBusy(false);}
 };
 return <div className="space-y-1"><button type="button" onClick={recover} disabled={busy} className="border border-ink px-3 py-2 font-mono text-xs uppercase disabled:opacity-40">{busy?"Scheduling…":"Requeue"}</button>{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
