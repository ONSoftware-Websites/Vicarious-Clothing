"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = "note" | "inspection" | "intake" | "packing" | "return";
type WorkflowRecord = {
 id:string; category:Category; note:string; checklist:Record<string,boolean>;
 created_at:string; actor_id:string|null;
};
const GROUPS:Record<Category,{title:string;fields:{key:string;label:string}[]}>={
 note:{title:"Internal note",fields:[]},
 inspection:{title:"Inspection",fields:[
 {key:"conditionVerified",label:"Condition checked against original submission"},
 {key:"photosChecked",label:"Photographs reviewed"},
 {key:"discrepanciesResolved",label:"Any discrepancies resolved with seller"}]},
 intake:{title:"Stock intake",fields:[
 {key:"received",label:"Items physically received"},
 {key:"labelled",label:"Physical SKU label attached"},
 {key:"stockLinked",label:"Acquisition linked to an inventory item"}]},
 packing:{title:"Packing and dispatch",fields:[
 {key:"itemsChecked",label:"Contents checked against order"},
 {key:"addressChecked",label:"Delivery address confirmed"},
 {key:"packagingChecked",label:"Packaging and condition checked"}]},
 return:{title:"Return inspection",fields:[
 {key:"requestReviewed",label:"Customer request reviewed"},
 {key:"itemReceived",label:"Returned item received"},
 {key:"conditionChecked",label:"Returned item inspected"}]}
};
const allowed={lead:["note","inspection","intake"] as Category[],order:["note","packing","return"] as Category[]};
export function WorkflowJournal({kind,referenceId}:{kind:"lead"|"order";referenceId:string}){
 const router=useRouter();
 const [category,setCategory]=useState<Category>("note");
 const [note,setNote]=useState("");
 const [checks,setChecks]=useState<Record<string,boolean>>({});
 const [entries,setEntries]=useState<WorkflowRecord[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const url="/api/admin/workflow-records?"+new URLSearchParams({kind,id:referenceId}).toString();
 const load=useCallback(async()=>{
  try{
   const res=await fetch(url,{cache:"no-store"});
   if(!res.ok)throw new Error("Could not load operational history");
   const data=await res.json();
   setEntries(data.records??[]);
  }catch(e){setError(e instanceof Error?e.message:"Could not load records");}
 },[url]);
 useEffect(()=>{void load();},[load]);
 const save=async()=>{
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category,note,checklist:checks})});
   const json=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(json.error??"Unable to save");
   setNote("");setChecks({});setNotice("Record saved.");
   await load();router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}
  finally{setBusy(false);}
 };
 return <section className="border border-line">
  <div className="border-b border-line bg-cream px-5 py-4">
   <h2 className="font-display text-sm font-bold uppercase tracking-widest">Workflow log & checklists</h2>
   <p className="mt-2 text-xs text-ink-soft">Create an attributable record of physical checks and operational decisions. These entries do not automatically change payment or order status.</p>
  </div>
  <div className="space-y-5 p-5">
   <div>
    <label className="mb-2 block font-mono text-xs uppercase" htmlFor={`workflow-type-${referenceId}`}>Type of entry</label>
    <select id={`workflow-type-${referenceId}`} value={category} onChange={e=>{setCategory(e.target.value as Category);setChecks({});}} className="h-11 w-full border border-line bg-paper px-3 text-sm">
      {allowed[kind].map(key=><option key={key} value={key}>{GROUPS[key].title}</option>)}
    </select>
   </div>
   {GROUPS[category].fields.length>0&&<fieldset className="space-y-3 border border-line p-4">
     <legend className="px-2 font-mono text-xs uppercase">Completed checks</legend>
     {GROUPS[category].fields.map(field=><label key={field.key} className="flex items-start gap-3 text-sm">
       <input type="checkbox" className="mt-1 accent-[#0097af]" checked={checks[field.key]??false} onChange={e=>setChecks(prev=>({...prev,[field.key]:e.target.checked}))}/>
       {field.label}
     </label>)}
   </fieldset>}
   <div><label className="mb-2 block font-mono text-xs uppercase" htmlFor={`workflow-note-${referenceId}`}>Notes / evidence</label>
    <textarea id={`workflow-note-${referenceId}`} rows={3} maxLength={4000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Record inspection findings, defects, package condition or next action…" className="w-full border border-line bg-paper p-3 text-sm"/>
   </div>
   <button type="button" disabled={busy||(!note.trim()&&!Object.keys(checks).length)} onClick={save} className="bg-ink px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider text-paper disabled:opacity-40">{busy?"Saving…":"Save workflow record"}</button>
   {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
   {notice&&<p role="status" className="text-xs text-accent-deep">{notice}</p>}
   <div className="border-t border-line pt-5">
     <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest">Recorded activity ({entries.length})</h3>
     {entries.length===0?<p className="text-sm text-ink-faint">No operational notes or checks have been recorded yet.</p>:
     <ol className="space-y-3">{entries.map(entry=><li key={entry.id} className="border-l-2 border-accent pl-4 text-sm">
       <p className="font-semibold">{GROUPS[entry.category]?.title??entry.category}</p>
       <p className="mt-1 font-mono text-[10px] text-ink-soft">{new Date(entry.created_at).toLocaleString("en-GB")} · Staff {entry.actor_id?.slice(0,8)??"system"}</p>
       {entry.note&&<p className="mt-2 whitespace-pre-wrap">{entry.note}</p>}
       {Object.keys(entry.checklist??{}).length>0&&<ul className="mt-2 space-y-1 text-xs text-ink-soft">{Object.entries(entry.checklist).map(([key,value])=><li key={key}>{value?"✓":"○"} {GROUPS[entry.category]?.fields.find(f=>f.key===key)?.label??key}</li>)}</ul>}
     </li>)}</ol>}
   </div>
  </div>
 </section>;
}
