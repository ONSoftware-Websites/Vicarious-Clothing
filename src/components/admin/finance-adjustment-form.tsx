"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {FINANCE_KINDS,type FinanceKind} from "@/lib/finance-report";

export function FinanceAdjustmentForm(){
 const router=useRouter();
 const [kind,setKind]=useState<FinanceKind>("fee");
 const [amount,setAmount]=useState("");
 const [orderId,setOrderId]=useState("");
 const [reference,setReference]=useState("");
 const [description,setDescription]=useState("");
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [saved,setSaved]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setSaved("");
  try{
   const response=await fetch("/api/admin/finance",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({kind,amount:Number(amount),orderId:orderId.trim()||null,reference:reference.trim(),description,occurredAt:date})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error??"Could not record transaction");
   setSaved("Financial adjustment recorded.");setAmount("");setOrderId("");setReference("");setDescription("");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not record transaction");}
  finally{setBusy(false)}
 }
 return <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
  <div><label htmlFor="fin-kind" className="mb-2 block font-mono text-[10px] uppercase">Record type</label>
   <select id="fin-kind" value={kind} onChange={e=>setKind(e.target.value as FinanceKind)} className="h-11 w-full border border-line bg-paper px-3 text-sm">
    {FINANCE_KINDS.map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}
   </select></div>
  <div><label htmlFor="fin-amount" className="mb-2 block font-mono text-[10px] uppercase">Amount (£)</label>
   <input id="fin-amount" type="number" min="0.01" step="0.01" max="1000000" required value={amount} onChange={e=>setAmount(e.target.value)} className="h-11 w-full border border-line bg-paper px-3 text-sm"/></div>
  <div><label htmlFor="fin-order" className="mb-2 block font-mono text-[10px] uppercase">Order reference {kind==="refund"?"(required)":"(optional)"}</label>
   <input id="fin-order" required={kind==="refund"} value={orderId} onChange={e=>setOrderId(e.target.value.toUpperCase())} placeholder="VC-…" className="h-11 w-full border border-line bg-paper px-3 text-sm"/></div>
  <div><label htmlFor="fin-reference" className="mb-2 block font-mono text-[10px] uppercase">External reference (unique within category)</label>
   <input id="fin-reference" minLength={3} maxLength={140} required value={reference} onChange={e=>setReference(e.target.value)} placeholder="Stripe / Royal Mail / bank reference" className="h-11 w-full border border-line bg-paper px-3 text-sm"/></div>
  <div><label htmlFor="fin-date" className="mb-2 block font-mono text-[10px] uppercase">Transaction date</label>
   <input id="fin-date" type="date" required value={date} onChange={e=>setDate(e.target.value)} className="h-11 w-full border border-line bg-paper px-3 text-sm"/></div>
  <div><label htmlFor="fin-description" className="mb-2 block font-mono text-[10px] uppercase">Notes</label>
   <input id="fin-description" maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Reason / receipt / details" className="h-11 w-full border border-line bg-paper px-3 text-sm"/></div>
  <div className="sm:col-span-2 space-y-3">
   <p className="text-xs text-ink-soft">These entries record money already paid or refunded. This form does not initiate payments, issue Stripe refunds or calculate tax.</p>
   <button type="submit" disabled={busy} className="bg-ink px-6 py-3 font-display text-xs font-semibold uppercase text-paper disabled:opacity-40">{busy?"Saving…":"Record adjustment"}</button>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   {saved&&<p role="status" className="text-sm text-accent-deep">{saved}</p>}
  </div>
 </form>;
}
