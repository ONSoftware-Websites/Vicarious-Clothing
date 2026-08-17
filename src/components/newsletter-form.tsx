"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  if (done) {
    return (
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
        You&apos;re on the list. See you at the next drop.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md gap-2">
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
        className="h-14 shrink-0 bg-paper px-7 font-display text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-cream"
      >
        Join →
      </button>
    </form>
  );
}
