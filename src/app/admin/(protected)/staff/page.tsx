import { redirect } from "next/navigation";
import { getAdminRole } from "@/lib/server/admin-auth";
import { getSupabase } from "@/lib/server/supabase";
import { StaffRoleEditor } from "@/components/admin/staff-role-editor";
export const dynamic="force-dynamic";
export const metadata={title:"Staff & Permissions | Vicarious"};
export default async function StaffPage(){
  if(await getAdminRole()!=="SUPER_ADMIN") redirect("/admin");
  const db=getSupabase();
  if(!db) return <p>Staff directory unavailable.</p>;
  const {data,error}=await db.from("admin_staff").select("user_id,role,active,created_at").order("created_at",{ascending:true});
  if(error) return <p>Staff directory unavailable.</p>;
  return <div className="space-y-7"><header className="border-b border-line pb-6"><p className="font-mono text-[10px] uppercase tracking-widest text-accent-deep">Administration / Access control</p><h1 className="mt-2 font-display text-3xl font-bold uppercase">Staff & Permissions</h1><p className="mt-3 max-w-2xl text-sm text-ink-soft">Only Super-admin can change website administrator membership. Each account must use its own verified email and MFA.</p></header>
    <div className="overflow-x-auto border border-line"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-cream"><tr>{["Account ID","Role","State","Manage"].map(t=><th key={t} className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider">{t}</th>)}</tr></thead><tbody className="divide-y divide-line">{(data??[]).map(staff=><tr key={staff.user_id}><td className="px-4 py-4 font-mono text-xs">{staff.user_id}</td><td className="px-4 py-4 font-mono text-xs">{staff.role.replaceAll("_"," ")}</td><td className="px-4 py-4">{staff.active?"Active":"Disabled"}</td><td className="px-4 py-4"><StaffRoleEditor userId={staff.user_id} role={staff.role} active={staff.active}/></td></tr>)}</tbody></table></div>
    <p className="text-xs text-ink-soft">To add a person, first create and verify their Supabase Auth account, then provision their membership through a controlled administrative process. Do not share passwords or service-role keys.</p>
  </div>;
}
