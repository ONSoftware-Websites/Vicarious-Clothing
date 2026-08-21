"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewsletterAddForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("manual");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    if (!consent) { setError("Consent is required to add a subscriber."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, consent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="subscriber@example.com"
        className="h-11 flex-1 min-w-[200px] border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
      />
      <select value={source} onChange={(e) => setSource(e.target.value)} className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase tracking-[0.12em] focus:border-ink focus:outline-none">
        <option value="manual">Manual</option>
        <option value="homepage">Homepage</option>
        <option value="checkout">Checkout</option>
        <option value="import">Import</option>
      </select>
      <label className="flex cursor-pointer items-center gap-2 border border-line px-3 text-xs">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 accent-[#0097af]" />
        Consent given
      </label>
      <button type="submit" disabled={busy} className="flex h-11 items-center justify-center bg-ink px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-accent disabled:opacity-50">
        {busy ? "Adding…" : "Add subscriber"}
      </button>
      {error && <p className="w-full font-mono text-[11px] uppercase tracking-[0.12em] text-red-700">{error}</p>}
    </form>
  );
}
