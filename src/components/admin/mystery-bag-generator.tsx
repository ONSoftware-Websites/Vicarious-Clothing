"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export function MysteryBagGenerator(){
 const router=useRouter();
 const [sku,setSku]=useState("");
 const [quantity,setQuantity]=useState(5);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function create(){
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/mystery-bags",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku,quantity})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error??"Could not create mystery bag stock");
   setMessage(`Created ${data.count} individual mystery bags from template ${data.template}. They are now listed in the Mystery Bags shop.`);
   router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Request failed");}
  finally{setBusy(false);}
 }
 return <section className="border border-line bg-paper p-6 space-y-4">
  <h2 className="font-display text-lg font-bold uppercase">Mystery bag stock generator</h2>
  <p className="text-sm text-ink-soft">First create a DRAFT product with the mystery bag's description, photographs, price and size. Enter its SKU here to generate individual saleable units. Each unit can be purchased once, allowing many customers to purchase the same advertised mystery bag. Never use real contents or promise a specific garment if the bag is a surprise.</p>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="text-xs font-semibold uppercase">Draft template SKU<input value={sku} onChange={e=>setSku(e.target.value.toUpperCase())} placeholder="VC-0001" className="mt-2 block w-full border border-line p-3 text-sm"/></label>
   <label className="text-xs font-semibold uppercase">Number of bags available<input type="number" min={1} max={100} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="mt-2 block w-full border border-line p-3 text-sm"/></label>
  </div>
  <button type="button" disabled={busy||!sku.trim()||!Number.isSafeInteger(quantity)||quantity<1||quantity>100} onClick={create} className="min-h-11 bg-ink px-6 text-xs font-semibold uppercase text-paper disabled:opacity-50">{busy?"Creating…":"Create saleable mystery bags"}</button>
  {message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
