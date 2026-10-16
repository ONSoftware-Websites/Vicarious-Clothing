import { LinkPurchasedStock } from "@/components/admin/link-purchased-stock";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { requireRole } from "@/lib/server/admin-auth";
import { listLeads,listPurchases } from "@/lib/server/store";
import { getSupabase } from "@/lib/server/supabase";
import { formatDateTime,formatPrice } from "@/lib/utils";
import { LeadStatusSelect } from "@/components/admin/lead-status-select";
import { WorkflowJournal } from "@/components/admin/workflow-journal";

export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 return {title:`Seller case ${id} | Vicarious`};
}
export default async function SellerCase({params}:{params:Promise<{id:string}>}){
 if(!(await requireRole("MANAGER")))redirect("/admin");
 const {id}=await params;
 const canManagePurchases=await requireRole("ADMIN");
 const [leads,purchases]=await Promise.all([listLeads(),listPurchases()]);
 const lead=leads.find(l=>l.id===id);
 if(!lead)notFound();
 const linked=purchases.find(p=>p.leadId===lead.id);
 const rawPhotos=(lead.notes??"").split("\n").map(line=>line.trim()).filter(line=>line.startsWith("PRIVATEPHOTO: ")||line.startsWith("PHOTO: "));
 const privatePaths=rawPhotos.filter(x=>x.startsWith("PRIVATEPHOTO: ")).map(x=>x.slice(14).trim());
 const db=getSupabase();
 const signed=privatePaths.length&&db?await db.storage.from("lead-photos-private").createSignedUrls(privatePaths,300):null;
 let signedIndex=0;
 const photos=rawPhotos.map(src=>src.startsWith("PRIVATEPHOTO: ")?signed?.data?.[signedIndex++]?.signedUrl??"":src.slice(7).trim()).filter(Boolean);
 const notes=(lead.notes??"").split("\n").filter(line=>!line.startsWith("PRIVATEPHOTO: ")&&!line.startsWith("PHOTO: ")).join("\n").trim();
 return <div className="space-y-6">
  <header className="border-b border-line pb-6">
   <Link href="/admin/leads" className="font-mono text-[10px] uppercase text-accent-deep underline">← Seller submissions</Link>
   <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-accent-deep">Acquisition / Seller case</p>
   <h1 className="mt-2 font-display text-3xl font-bold uppercase">{lead.brand} {lead.itemType}</h1>
   <p className="mt-2 text-xs text-ink-faint">{lead.id} · Submitted {formatDateTime(lead.createdAt)}</p>
  </header>
  <div className="grid gap-6 xl:grid-cols-3">
   <div className="space-y-6 xl:col-span-2">
    <section className="border border-line">
     <h2 className="border-b border-line bg-cream px-5 py-4 font-display text-sm font-semibold uppercase">Seller submission</h2>
     <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
      {[["Item",lead.brand+" "+lead.itemType],["Size",lead.size],["Condition",lead.condition],["Contact",lead.name],["Email",lead.email],["Status",lead.status.replaceAll("_"," ")]].map(([label,value])=><div key={label}><dt className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
     </dl>
     {notes&&<p className="mx-5 mb-5 whitespace-pre-wrap border-t border-line pt-4 text-sm">{notes}</p>}
     {photos.length>0&&<div className="grid grid-cols-3 gap-3 border-t border-line p-5 sm:grid-cols-4">{photos.map((src,i)=><a key={src} href={src} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden bg-cream">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={`Seller photograph ${i+1}`} className="h-full w-full object-cover"/></a>)}</div>}
    </section>
    <WorkflowJournal kind="lead" referenceId={lead.id}/>
   </div>
   <aside className="space-y-6">
    <section className="space-y-4 border border-line p-5">
     <h2 className="font-display text-sm font-semibold uppercase">Acquisition decision</h2>
     <LeadStatusSelect id={lead.id} status={lead.status} currentOffer={lead.offer}/>
     {lead.offer&&<p className="text-sm text-accent-deep">Offer: {lead.offer}</p>}
     <p className="text-xs text-ink-soft">Review the submitted condition before offering. When received, record an inspection before completing seller payment.</p>
    </section>
    <section className="space-y-3 border border-line p-5">
     <h2 className="font-display text-sm font-semibold uppercase">Stock acquisition</h2>
     {linked?<><p className="text-sm font-medium">{formatPrice(linked.amount)} · {linked.status}</p><p className="font-mono text-xs text-ink-soft">Purchase {linked.id}</p><p className="text-xs">{linked.items.length} linked inventory items</p><Link href="/admin/purchases" className="inline-block font-mono text-xs uppercase text-accent-deep underline">Open purchase ledger →</Link></>:
      <p className="text-sm text-ink-soft">No linked purchase yet. A validated accepted offer creates an acquisition record.</p>}
     {canManagePurchases&&<><div className="border-t border-line pt-3"><Link href="/admin/inventory/new" className="font-mono text-xs uppercase text-accent-deep underline">Create inventory item →</Link></div>{linked&&<LinkPurchasedStock purchaseId={linked.id} alreadyLinked={linked.items.map(i=>i.sku)} totalAmount={linked.amount}/>}</>}
    </section>
   </aside>
  </div>
 </div>;
}
