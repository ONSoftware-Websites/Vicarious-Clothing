"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
const ROLES=["STAFF","MANAGER","ADMIN","OWNER","SUPER_ADMIN"];
export function StaffRoleEditor({userId,role,active}:{userId:string;role:string;active:boolean}){
 const router=useRouter();
 const [selected,setSelected]=useState(role);
 const [enabled,setEnabled]=useState(active);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const save=async()=>{
   if(!window.confirm("Update this administrator's access? This can revoke access immediately."))return;
   setBusy(true);setError("");
   try{
     const res=await fetch("/api/admin/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,role:selected,active:enabled})});
     if(!res.ok){const json=await res.json().catch(()=>({}));throw new Error(json.error??"Failed to update account");}
     router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Unable to update");}
   finally{setBusy(false);}
 };
 return <div className="flex flex-wrap items-center gap-2">
   <select aria-label="Staff role" value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)} className="border border-line bg-paper px-2 py-2 font-mono text-xs">{ROLES.map(r=><option key={r} value={r}>{r.replaceAll("_"," ")}</option>)}</select>
   <label className="flex items-center gap-1 font-mono text-xs"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} disabled={busy}/> Active</label>
   <button type="button" disabled={busy||(selected===role&&enabled===active)} onClick={save} className="bg-ink px-3 py-2 font-mono text-xs text-paper disabled:opacity-40">{busy?"Saving…":"Save"}</button>
   {error&&<span role="alert" className="w-full text-xs text-red-700">{error}</span>}
 </div>;
}
