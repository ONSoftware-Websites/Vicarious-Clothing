import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/server/admin-auth";
import { TrafficAnalytics } from "@/components/admin/traffic-analytics";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Traffic Analytics" };

export default async function TrafficPage() {
  if (!(await requireRole("ADMIN"))) redirect("/admin");
  return <TrafficAnalytics />;
}
