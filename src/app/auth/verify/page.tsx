"use client";

import { useState } from "react";
import { Container } from "@/components/ui";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function VerifyPage() {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Password updated</h1>
        <p className="mt-3 text-sm text-ink-soft">You can now sign in with your new password.</p>
        <a href="/auth/login" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2">Sign in</a>
      </Container>
    );
  }

  return (
    <Container className="py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Set new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">New password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper hover:bg-accent disabled:opacity-50">
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </Container>
  );
}
