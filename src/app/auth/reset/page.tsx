"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/account/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Reset failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm text-ink-soft">If an account exists for {email}, you’ll get a reset link.</p>
        <Link href="/auth/login" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2">Back to sign in</Link>
      </Container>
    );
  }

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-ink-soft">We’ll send you a link to set a new password.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" autoComplete="email" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper hover:bg-accent disabled:opacity-50">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </Container>
  );
}
