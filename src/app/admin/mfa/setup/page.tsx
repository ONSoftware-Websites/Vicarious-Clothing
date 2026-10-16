import type { Metadata } from "next";
import { SecureAdminLogin } from "@/components/admin/secure-admin-login";

export const metadata: Metadata = { title: "Set up administrator MFA" };
export const dynamic = "force-dynamic";

export default function AdminMfaSetupPage() {
  return <SecureAdminLogin enrollmentOnly />;
}
