import { hasAdminPassword } from "@/lib/admin-config";
import { AdminLoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  const configured = hasAdminPassword();
  return (
    <div>
      {!configured && (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-amber-900">
          ADMIN_PASSWORD is not set — set it in .env (and in Vercel) to enable
          admin login. No password will be accepted until it is set.
        </div>
      )}
      <AdminLoginForm />
    </div>
  );
}
