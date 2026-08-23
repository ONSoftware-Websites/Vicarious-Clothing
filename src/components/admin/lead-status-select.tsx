"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";

export function LeadStatusSelect({
  id,
  status,
  currentOffer,
}: {
  id: string;
  status: LeadStatus;
  currentOffer?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState(currentOffer ?? "");
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  const doUpdate = async (nextStatus: LeadStatus, offerValue?: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, offer: offerValue }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (next: LeadStatus) => {
    if (next === "OFFER_SENT") {
      setPendingStatus(next);
      setOffer(currentOffer ?? "");
      setShowOffer(true);
      return;
    }
    doUpdate(next);
  };

  if (showOffer) {
    return (
      <div className="w-64 border border-ink bg-paper p-3 shadow-lg">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Offer details</p>
        <input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="£30  — e.g. £30 + free postage"
          className="mb-3 h-9 w-full border border-line bg-paper px-2 font-mono text-xs focus:border-ink focus:outline-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy || !offer.trim()}
            onClick={() => {
              setShowOffer(false);
              doUpdate(pendingStatus!, offer.trim());
            }}
            className="flex-1 bg-ink px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-paper hover:bg-accent disabled:opacity-50"
          >
            Send offer
          </button>
          <button type="button" onClick={() => setShowOffer(false)} className="border border-line px-3 py-2 font-mono text-[10px] uppercase">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
      className="h-9 border border-line bg-paper px-2 font-mono text-[10px] uppercase tracking-[0.1em] focus:border-ink focus:outline-none disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
