"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { useAccount } from "@/hooks/use-account";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/preferences", label: "Preferences" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { profile, loading, signOut } = useAccount();
  const pathname = usePathname();

  if (loading) {
    return (
      <Container className="py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          Loading…
        </p>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-2 font-display text-3xl font-semibold uppercase tracking-tight">
            Account
          </h1>
          <p className="mb-8 text-sm text-ink-soft">
            Sign in to see your orders, addresses and wishlist. Guest checkout is still available.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="flex h-12 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="flex h-12 w-full items-center justify-center border border-ink font-display text-xs font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-paper"
            >
              Create account
            </Link>
          </div>
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            <Link href="/shop" className="text-accent-deep underline underline-offset-2">Continue shopping</Link> without an account
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
            Account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-tight">
            Hello, {profile.name.split(" ")[0]}
          </h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint underline underline-offset-4 hover:text-accent-deep"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        <nav aria-label="Account" className="flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent-deep"
                  : "font-display text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-accent-deep"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="lg:col-span-3">{children}</div>
      </div>
    </Container>
  );
}
