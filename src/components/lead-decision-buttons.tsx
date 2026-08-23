"use client";

import { useState } from "react";

type Decision = "accept" | "decline";

export function LeadDecisionButtons({
  id,
  token,
  initialIntent,
}: {
  id: string;
  token: string;
  initialIntent?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ACCEPTED" | "DECLINED" | null>(null);
  const [error, setError] = useState("");

  const decide = async (decision: Decision) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(id)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not record your decision.");
      setResult(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your decision.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="border border-line bg-cream p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
          Offer {result === "ACCEPTED" ? "accepted" : "declined"}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {result === "ACCEPTED"
            ? "Thanks — Vicarious will contact you with the next steps for sending or handing over the item."
            : "Your decision has been recorded. You do not need to do anything else."}
        </p>
      </div>
    );
  }

  const primary = initialIntent === "decline" ? "decline" : "accept";
  const secondary = primary === "accept" ? "decline" : "accept";

  const label = (decision: Decision) => (decision === "accept" ? "Accept offer" : "Decline offer");

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(primary)}
          className="h-12 bg-ink px-7 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Saving…" : label(primary)}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(secondary)}
          className="h-12 border border-ink px-7 font-display text-xs font-semibold uppercase tracking-[0.16em] hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {label(secondary)}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
