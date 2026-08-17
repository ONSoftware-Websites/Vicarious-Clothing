import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { adminEnabled } from "@/lib/admin-config";
import { isAdminSession } from "@/lib/server/admin-auth";
import { LogoutButton } from "@/components/admin/logout-button";

export const metadata: Metadata = {
  title: {
    default: "Admin | Vicarious Clothing",
    template: "%s | Vicarious Admin",
  },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/leads", label: "Sell To Us" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/marketplace", label: "Marketplace" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/journal", label: "Journal" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      {!adminEnabled() && (
        <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-amber-900">
          ADMIN_PASSWORD is not set — admin access is open in this environment.
          Set it in .env to protect the admin area.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-ink text-paper">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="font-display text-sm font-bold uppercase tracking-[0.12em]"
            >
              Vicarious Admin
            </Link>
            <nav aria-label="Admin" className="hidden items-center gap-6 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-paper/70 transition-colors hover:text-paper"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/60 hover:text-paper"
            >
              View store →
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
