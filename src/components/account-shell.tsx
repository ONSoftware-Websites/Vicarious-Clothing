"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Container } from "@/components/ui";
import { useAccount } from "@/hooks/use-account";
import { useMounted } from "@/hooks/use-local-storage";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/preferences", label: "Preferences" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { profile, signIn, signOut } = useAccount();
  const mounted = useMounted();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!mounted) {
    return (
      <Container className="py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          Loading…
        </p>
      </Container>
    );
  }

  if (!profile) {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !email.includes("@")) {
        setError("Enter your name and a valid email.");
        return;
      }
      signIn(name.trim(), email.trim());
      fetch("/api/account/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      }).catch(() => {});
    };

    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-md">
          <h1 className="mb-2 font-display text-3xl font-semibold uppercase tracking-tight">
            Account
          </h1>
          <p className="mb-8 text-sm text-ink-soft">
            Accounts are optional here — you can shop without one. Sign in to
            see orders, addresses and your wishlist.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="acc-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                Name
              </label>
              <input
                id="acc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="acc-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                Email
              </label>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              className="flex h-13 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent"
            >
              Continue
            </button>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              Demo sign-in — no password needed yet
            </p>
          </form>
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
