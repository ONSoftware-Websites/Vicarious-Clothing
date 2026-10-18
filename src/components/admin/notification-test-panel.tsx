"use client";
import { useState } from "react";

const notifications = [
 {kind:"welcome",label:"Welcome / account created"},
 {kind:"order-confirmed",label:"Order confirmation"},
 {kind:"admin-order-alert",label:"New paid order — admin alert"},
 {kind:"order-dispatched",label:"Order dispatched"},
 {kind:"order-delivered",label:"Order delivered"},
 {kind:"order-refunded",label:"Order refunded"},
 {kind:"order-cancelled",label:"Order cancelled"},
 {kind:"password-reset",label:"Password reset"},
 {kind:"lead-enquiry",label:"Seller submission received"},
 {kind:"lead-offer",label:"Seller offer issued"}
] as const;
type Kind=(typeof notifications)[number]["kind"];

export function NotificationTestPanel() {
 const [running,setRunning]=useState<Kind|null>(null);
 const [results,setResults]=useState<Record<string,{ok:boolean;message:string}>>({});
 async function test(kind:Kind){
  setRunning(kind);
  setResults(previous=>({...previous,[kind]:{ok:false,message:"Sending…"}}));
  try{
   const response=await fetch("/api/admin/notification-test",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind})
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"Notification test failed");
   setResults(previous=>({...previous,[kind]:{ok:true,message:"Accepted by email provider"}}));
  }catch(error){
   setResults(previous=>({...previous,[kind]:{ok:false,message:error instanceof Error?error.message:"Could not send test"}}));
  }finally{setRunning(null);}
 }
 return <section className="border border-line bg-paper p-6">
  <h2 className="font-display text-xl font-semibold uppercase">Notification trigger tests</h2>
  <p className="mt-2 text-sm leading-6 text-ink-soft">Each button runs the existing notification template and delivery function with isolated sample data. All tests go exclusively to <strong>admin@vicariousclothing.co.uk</strong>. No real order, payment, stock or account state is changed.</p>
  <p className="mt-2 text-xs text-ink-soft">A successful result means the email provider accepted the message, not that it has arrived in the inbox. Example buttons and links in sample emails may not perform real actions.</p>
  <div className="mt-5 grid gap-3 md:grid-cols-2">
   {notifications.map(item=><div key={item.kind} className="border border-line p-4">
    <p className="font-display text-xs font-semibold uppercase tracking-wide">{item.label}</p>
    <button type="button" disabled={running!==null} onClick={()=>void test(item.kind)}
     className="mt-3 min-h-10 border border-ink px-4 font-mono text-[11px] uppercase hover:bg-ink hover:text-paper disabled:opacity-50">
     {running===item.kind?"Sending…":"Trigger test"}
    </button>
    {results[item.kind]&&<p role="status" className={results[item.kind].ok?"mt-2 text-xs text-emerald-700":"mt-2 text-xs text-red-700"}>{results[item.kind].message}</p>}
   </div>)}
  </div>
 </section>;
}
