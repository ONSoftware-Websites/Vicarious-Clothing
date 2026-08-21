"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Check your email</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">We sent a verification link to {email}. Click it to finish creating your account.</p>
        <Link href="/auth/login" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2">Sign in</Link>
      </Container>
    );
  }

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-ink-soft">Orders, wishlists and addresses — saved for next time.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Password (min 6)</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper hover:bg-accent disabled:opacity-50">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Already have an account? <Link href="/auth/login" className="text-accent-deep underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </Container>
  );
}
