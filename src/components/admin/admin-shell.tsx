"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/types";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/admin/logout-button";

const groups = [
  { title:"Workspace", links:[["Overview","/admin",1],["Operations","/admin/operations",2],["Orders","/admin/orders",3],["Inventory","/admin/inventory",2],["Sell To Us","/admin/leads",2],["Purchases","/admin/purchases",3]] },
  { title:"Business",links:[["Marketplace","/admin/marketplace",2],["Finance & analytics","/admin/analytics",3],["Marketing","/admin/marketing",2]] },
  { title:"Administration",links:[["Journal","/admin/journal",2],["Settings & Integrations","/admin/settings",4],["Staff & Permissions","/admin/staff",5],["Maintenance","/admin/maintenance",4]] },
] as const;
const roles:Record<Role,number> = {CUSTOMER:0,STAFF:1,MANAGER:2,ADMIN:3,OWNER:4,SUPER_ADMIN:5};

export function AdminShell({role,children}:{role:Role;children:React.ReactNode}) {
  const pathname = usePathname();
  const [expanded,setExpanded] = useState(false);
  const level = roles[role];
  const sidebar = <div className="flex h-full flex-col bg-ink text-paper">
    <Link href="/admin" onClick={()=>setExpanded(false)} className="flex items-center gap-3 border-b border-paper/15 px-6 py-6">
      <BrandMark size={36} className="h-9 w-9"/>
      <span className="font-display text-sm font-bold uppercase tracking-[0.13em]">Vicarious <span className="block font-mono text-[9px] font-normal tracking-[0.25em] text-paper/50">Administration</span></span>
    </Link>
    <nav aria-label="Administration" className="no-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-6">
      {groups.map(group=>{
        const links=group.links.filter(link=>level>=link[2]);
        if (!links.length) return null;
        return <div key={group.title}>
          <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/40">{group.title}</p>
          <div className="space-y-1">{links.map(([label,href])=>{
            const active = pathname===href || (href!=="/admin" && pathname.startsWith(href+"/"));
            return <Link key={href} href={href} onClick={()=>setExpanded(false)} aria-current={active?"page":undefined}
              className={`flex min-h-10 items-center justify-between border-l-2 px-3 py-2 font-display text-[11px] font-medium uppercase tracking-[0.11em] transition-colors ${active?"border-accent bg-paper/10 text-paper":"border-transparent text-paper/60 hover:bg-paper/5 hover:text-paper"}`}>
              {label}{active && <span className="h-1.5 w-1.5 rounded-full bg-accent"/>}
            </Link>;
          })}</div>
        </div>;
      })}
    </nav>
    <div className="border-t border-paper/15 px-5 py-4">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/45">Signed in as {role.replaceAll("_"," ")}</p>
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="font-mono text-[10px] uppercase tracking-wider text-paper/70 hover:text-paper">View store ↗</Link>
        <LogoutButton/>
      </div>
    </div>
  </div>;
  return <div className="min-h-screen bg-paper lg:pl-64">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <button type="button" aria-expanded={expanded} aria-controls="admin-mobile-navigation" onClick={()=>setExpanded(v=>!v)}
          className="flex h-10 w-10 items-center justify-center border border-line font-display text-xl lg:hidden" aria-label={expanded?"Close navigation":"Open navigation"}>
          {expanded?"×":"☰"}
        </button>
        <span className="font-display text-xs font-bold uppercase tracking-[0.16em]">Admin workspace</span>
      </div>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft sm:block">{role.replaceAll("_"," ")}</span>
    </header>
    {expanded && <div className="fixed inset-0 z-40 lg:hidden">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/60" onClick={()=>setExpanded(false)}/>
      <aside id="admin-mobile-navigation" className="absolute inset-y-0 left-0 w-[min(85vw,320px)]">{sidebar}</aside>
      <button type="button" aria-label="Close navigation" onClick={()=>setExpanded(false)} className="absolute right-4 top-4 bg-paper px-3 py-2 text-ink">Close ×</button>
    </div>}
    <main id="admin-main" className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-8 sm:py-10 lg:px-10">{children}</main>
  </div>;
}
