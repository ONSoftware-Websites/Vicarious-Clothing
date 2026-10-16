"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RequestReturn({orderId}:{orderId:string}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [reason,setReason]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [submitted,setSubmitted]=useState(false);
 const submit=async()=>{
  setBusy(true);setError("");
  try{
   const res=await fetch(`/api/orders/${encodeURIComponent(orderId)}/return`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({reason:reason.trim()})
   });
   const result=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(result.error??"Unable to submit return request");
   setSubmitted(true);setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit return request");}
  finally{setBusy(false);}
 };
 if(submitted)return <p role="status" className="border border-line bg-cream p-5 text-sm">Your return request has been received. We will review it and contact you about the next steps.</p>;
 return <section className="mt-8 border border-line p-5 text-left">
  <h2 className="font-display text-sm font-semibold uppercase tracking-widest">Need to return something?</h2>
  <p className="mt-2 text-sm text-ink-soft">Request a return for review. Submitting this form does not automatically issue a refund or approve the return.</p>
  {!open?<button type="button" onClick={()=>setOpen(true)} className="mt-4 border border-ink px-6 py-3 font-display text-xs uppercase hover:bg-ink hover:text-paper">Request a return</button>:
   <div className="mt-4 space-y-3">
    <label htmlFor="return-reason" className="block font-mono text-xs uppercase">What would you like to return, and why?</label>
    <textarea id="return-reason" rows={4} minLength={10} maxLength={2000} value={reason}
     onChange={e=>setReason(e.target.value)} placeholder="Tell us which item(s) you are returning and why…" className="w-full border border-line bg-paper p-3 text-sm"/>
    <div className="flex flex-wrap gap-3">
     <button type="button" disabled={busy||reason.trim().length<10} onClick={submit} className="bg-ink px-5 py-3 font-display text-xs font-semibold uppercase text-paper disabled:opacity-40">{busy?"Submitting…":"Submit request"}</button>
     <button type="button" disabled={busy} onClick={()=>setOpen(false)} className="border border-line px-5 py-3 font-mono text-xs uppercase">Cancel</button>
    </div>
    {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
   </div>}
 </section>;
}
