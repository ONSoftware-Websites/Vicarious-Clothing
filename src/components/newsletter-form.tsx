"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !consent) return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "homepage", consent: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
        You&apos;re on the list. See you at the next drop.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-md space-y-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL ADDRESS"
          className="h-14 flex-1 border border-paper/30 bg-transparent px-4 font-mono text-xs uppercase tracking-[0.14em] placeholder:text-paper/40 focus:border-paper focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending" || !consent}
          className="h-14 shrink-0 bg-paper px-7 font-display text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-cream disabled:opacity-50"
        >
          {state === "sending" ? "…" : "Join →"}
        </button>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-left">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-paper" required />
        <span className="text-[11px] leading-relaxed text-paper/70">I agree to receive marketing emails about new drops. I can unsubscribe anytime.</span>
      </label>
      {state === "error" && (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-300" role="alert">
          That didn&apos;t work — please try again.
        </p>
      )}
    </form>
  );
}
