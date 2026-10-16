import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminRole } from "@/lib/server/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({children}:{children:ReactNode}) {
  const role=await getAdminRole();
  if(role==="CUSTOMER") redirect("/admin/login");
  return <AdminShell role={role}>{children}</AdminShell>;
}
