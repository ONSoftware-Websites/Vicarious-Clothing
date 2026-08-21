"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/ui";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };



  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Welcome back — your orders and wishlist are waiting.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper hover:bg-accent disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-6 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
          <Link href="/auth/signup" className="text-accent-deep underline underline-offset-2">Create account</Link>
          <Link href="/auth/reset" className="text-ink-faint underline underline-offset-2">Forgot password?</Link>
        </div>
      </div>
    </Container>
  );
}
