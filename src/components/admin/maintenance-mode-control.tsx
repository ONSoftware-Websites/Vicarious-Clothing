"use client";
import {useEffect,useState} from "react";
export function MaintenanceModeControl(){
 const [enabled,setEnabled]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [updatedAt,setUpdatedAt]=useState("");
 useEffect(()=>{
  let cancelled=false;
  fetch("/api/admin/maintenance-mode",{cache:"no-store"})
   .then(async res=>{const d=await res.json();if(!res.ok)throw new Error(d.error??"Unavailable");return d;})
   .then(d=>{if(!cancelled){setEnabled(d.enabled);setUpdatedAt(d.updatedAt);}})
   .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Unable to read maintenance status");});
  return ()=>{cancelled=true;};
 },[]);
 const toggle=async()=>{
  if(enabled===null)return;
  const next=!enabled;
  if(!window.confirm(next
   ?"Enable maintenance? Customers will be redirected to the maintenance page; existing administrators retain access."
   :"Disable maintenance and reopen the storefront to customers?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch("/api/admin/maintenance-mode",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:next})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error??"Unable to update maintenance");
   setEnabled(data.enabled);setUpdatedAt(data.updatedAt);
   setNotice(data.enabled?"Maintenance is enabled. New storefront requests show the maintenance page.":"Maintenance is disabled. The storefront is open.");
  }catch(e){setError(e instanceof Error?e.message:"Could not update maintenance");}
  finally{setBusy(false);}
 };
 return <section className="border border-line">
  <div className="border-b border-line bg-cream p-5"><h2 className="font-display text-base font-bold uppercase">Storefront maintenance mode</h2>
  <p className="mt-2 text-sm text-ink-soft">Show the existing full-screen maintenance page whenever the shop needs to close temporarily. Changes apply to new requests without deploying.</p></div>
  <div className="space-y-4 p-5">
   <div className="flex flex-wrap items-center justify-between gap-4">
    <div><p className="font-display text-lg font-semibold">{enabled===null?"Checking current status…":enabled?"Maintenance ON — shop closed":"Maintenance OFF — shop open"}</p>
     {updatedAt&&<p className="mt-1 text-xs text-ink-soft">Last changed: {new Date(updatedAt).toLocaleString("en-GB")}</p>}
    </div>
    <button type="button" role="switch" aria-checked={enabled??false} aria-label="Storefront maintenance mode"
      disabled={enabled===null||busy} onClick={toggle}
      className={`min-w-36 border px-5 py-3 font-mono text-xs font-semibold uppercase disabled:opacity-40 ${enabled?"border-amber-700 bg-amber-50 text-amber-950":"border-ink bg-ink text-paper"}`}>
      {busy?"Updating…":enabled===null?"Loading…":enabled?"Turn OFF":"Turn ON"}
    </button>
   </div>
   <p className="text-xs text-ink-soft">Administrators, webhook integrations, cron jobs and required assets remain accessible. This setting does not cancel existing orders or stop backend processing.</p>
   {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   {notice&&<p role="status" className="text-sm text-accent-deep">{notice}</p>}
  </div>
 </section>;
}
