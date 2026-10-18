"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SellerHqRetryAction() {
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const run=async()=>{
  setBusy(true);setMessage("");
  try {
   const response=await fetch("/api/admin/sellerhq/retry",{method:"POST"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Could not process retries");
   setMessage(`Processed ${data.processed??0}; delivered ${data.delivered??0}; failed ${data.failed??0}.`);
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Retry unavailable");}
  finally{setBusy(false);}
 };
 return <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={run} className="min-h-11 border border-ink px-4 font-display text-xs font-semibold uppercase hover:bg-ink hover:text-paper disabled:opacity-50">{busy?"Processing…":"Retry due SellerHQ deliveries"}</button>{message&&<p role="status" className="text-xs text-ink-soft">{message}</p>}</div>;
}
