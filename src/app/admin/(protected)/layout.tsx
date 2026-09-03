import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminSession } from "@/lib/server/admin-auth";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/admin/logout-button";

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
  { href: "/admin/maintenance", label: "Maintenance" },
];

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-ink text-paper">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-display text-sm font-bold uppercase tracking-[0.12em]"
            >
              <BrandMark size={28} className="h-7 w-7" />
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
