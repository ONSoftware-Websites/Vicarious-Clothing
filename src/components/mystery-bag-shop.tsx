"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {useCart} from "@/hooks/use-cart";
import {useShopUi} from "@/hooks/use-shop-ui";
type Offer={template:string;count:number;name:string;description:string;price:number;image:string;sku:string};
export function MysteryBagShop(){
 const [offers,setOffers]=useState<Offer[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");
 const {add}=useCart();
 const {openBag}=useShopUi();
 useEffect(()=>{
  fetch("/api/mystery-bags",{cache:"no-store"})
  .then(async response=>{if(!response.ok)throw new Error("Could not load mystery bags");return response.json();})
  .then(data=>setOffers(data.offers??[]))
  .catch(()=>setError("Mystery bags cannot be loaded right now. Please try again."))
  .finally(()=>setLoading(false));
 },[]);
 async function buy(template:string){
  setError("");setBusy(template);
  try{
   const response=await fetch("/api/mystery-bags",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({template})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error??"Could not reserve a mystery bag");
   add(data.sku);openBag();
   setOffers(current=>current.map(o=>o.template===template?{...o,count:Math.max(0,o.count-1)}:o));
  }catch(e){setError(e instanceof Error?e.message:"Mystery bag unavailable");}
  finally{setBusy(null);}
 }
 return <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
  <header className="mb-10 border-b border-line pb-8">
   <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-deep">Something unexpected</p>
   <h1 className="mt-3 font-display text-4xl font-bold uppercase">Mystery Bags</h1>
   <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft">Choose a mystery bag from our available range. Each purchase is a separate bag, even where the listing is the same. Exact contents are a surprise; check the listing description for what is included before buying.</p>
  </header>
  {error&&<p role="alert" className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  {loading?<p className="text-sm text-ink-soft">Loading mystery bags…</p>:offers.length===0?<div className="border border-line bg-cream p-8"><p>No mystery bags are currently available.</p><Link href="/shop" className="mt-4 inline-block text-sm underline">Browse clothing</Link></div>:
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{offers.map(o=><article key={o.template} className="overflow-hidden border border-line">
   <div className="relative aspect-square bg-cream">{o.image?<Image src={o.image} alt={o.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover"/>:<div className="flex h-full items-center justify-center font-display text-xl uppercase text-ink-soft">Mystery Bag</div>}</div>
   <div className="space-y-3 p-5">
    <h2 className="font-display text-lg font-semibold uppercase">{o.name}</h2>
    <p className="text-sm text-ink-soft">{o.description}</p>
    <p className="font-mono text-sm font-semibold">£{o.price.toFixed(2)}</p>
    <p className="text-xs text-ink-soft">{o.count} {o.count===1?"bag":"bags"} currently available</p>
    <button type="button" onClick={()=>void buy(o.template)} disabled={busy!==null||o.count<1} className="min-h-12 w-full bg-ink px-4 font-display text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50">{busy===o.template?"Reserving…":"Add a mystery bag to basket"}</button>
   </div>
  </article>)}</div>}
 </main>;
}
