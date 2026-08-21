import { adminEnabled } from "@/lib/admin-config";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  if (!adminEnabled()) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="font-display text-2xl font-semibold uppercase tracking-tight">
          Admin access is open
        </p>
        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          No ADMIN_PASSWORD is set, so no login is required. Set{" "}
          <code className="font-mono text-xs">ADMIN_PASSWORD</code> in your
          environment to enable the gate.
        </p>
        <Link
          href="/admin"
          className="mt-8 flex h-12 items-center justify-center bg-ink px-8 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-accent"
        >
          Continue to admin
        </Link>
      </div>
    );
  }

  return <AdminLoginForm />;
}
