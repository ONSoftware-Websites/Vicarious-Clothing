"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PurchaseActions({
  id,
  paid,
}: {
  id: string;
  paid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const markPaid = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "paid", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not mark paid");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark paid");
    } finally {
      setBusy(false);
    }
  };

  if (paid) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
        Paid
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={markPaid}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep underline underline-offset-2 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Mark paid"}
      </button>
      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
