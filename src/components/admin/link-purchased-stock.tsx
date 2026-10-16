"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function LinkPurchasedStock({purchaseId,alreadyLinked,totalAmount}:{purchaseId:string;alreadyLinked:string[];totalAmount:number}){
 const router=useRouter();
 const [sku,setSku]=useState("");
 const [cost,setCost]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const submit=async()=>{
  setBusy(true);setError("");setNotice("");
  try{
   const result=await fetch("/api/admin/purchases/link-stock",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({purchaseId,sku:sku.trim(),cost:Number(cost)})});
   const json=await result.json().catch(()=>({}));
   if(!result.ok)throw new Error(json.error??"Unable to link this item");
   setSku("");setCost("");setNotice("Stock linked to this acquisition.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to link item");}
  finally{setBusy(false);}
 };
 return <div className="space-y-3 border-t border-line pt-4">
  <h3 className="font-display text-xs font-bold uppercase tracking-wider">Link acquired inventory</h3>
  <p className="text-xs text-ink-soft">First create a product, then associate its SKU and allocated acquisition cost with this purchase. Existing links: {alreadyLinked.length}; total acquisition {totalAmount.toLocaleString("en-GB",{style:"currency",currency:"GBP"})}.</p>
  {alreadyLinked.length>0&&<p className="break-words font-mono text-[10px] text-ink-soft">{alreadyLinked.join(", ")}</p>}
  <div className="flex flex-col gap-2">
   <label className="font-mono text-[10px] uppercase" htmlFor="acq-sku">Inventory SKU</label>
   <input id="acq-sku" value={sku} onChange={e=>setSku(e.target.value.toUpperCase())} placeholder="VC-000123" className="h-10 border border-line bg-paper px-3 font-mono text-xs"/>
   <label className="font-mono text-[10px] uppercase" htmlFor="acq-cost">Allocated cost (£)</label>
   <input id="acq-cost" type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} className="h-10 border border-line bg-paper px-3 font-mono text-xs"/>
   <button type="button" onClick={submit} disabled={busy||!sku.trim()||!cost.trim()||Number(cost)<0} className="bg-ink px-4 py-3 font-display text-[10px] uppercase tracking-wider text-paper disabled:opacity-40">{busy?"Linking…":"Link stock"}</button>
  </div>
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  {notice&&<p role="status" className="text-xs text-accent-deep">{notice}</p>}
 </div>;
}
