"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function StripeReconcileForm(){
 const router=useRouter();
 const [id,setId]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const reconcile=async()=>{
  setBusy(true);setError("");setMessage("");
  try{
   const res=await fetch("/api/admin/finance/reconcile-stripe",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:id.trim()})
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error??"Stripe reconciliation failed");
   setMessage(`Verified ${data.charges} charge(s), ${data.refunds} completed refund(s). ${data.entriesChecked} records checked for idempotent import.`);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to reconcile");}
  finally{setBusy(false);}
 };
 return <div className="space-y-3">
  <h3 className="font-display text-sm font-semibold uppercase">Reconcile a Stripe payment</h3>
  <p className="text-xs text-ink-soft">Fetch verified processing fees and successful refunds from Stripe for an order. Running this more than once will not duplicate Stripe references. No payment or refund is initiated.</p>
  <label htmlFor="stripe-reconcile-order" className="block font-mono text-[10px] uppercase">Order reference</label>
  <div className="flex flex-wrap gap-3"><input id="stripe-reconcile-order" value={id} onChange={e=>setId(e.target.value.toUpperCase())} placeholder="VC-…" className="h-11 min-w-0 flex-1 border border-line bg-paper px-3 font-mono text-xs"/>
   <button type="button" onClick={reconcile} disabled={busy||!id.trim()} className="bg-ink px-5 py-3 font-display text-xs font-semibold uppercase text-paper disabled:opacity-40">{busy?"Checking…":"Reconcile"}</button>
  </div>
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  {message&&<p role="status" className="text-xs text-accent-deep">{message}</p>}
 </div>;
}
