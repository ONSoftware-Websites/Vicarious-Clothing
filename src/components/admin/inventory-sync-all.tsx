"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InventorySyncAll() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const syncAll = async () => {
    if (!window.confirm("Sync every linked Vicarious product with SellerHQ? Products without a PRD code will be skipped.")) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_all_sellerhq" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setMessage(`Synced ${data.synced ?? 0}; skipped ${data.skipped ?? 0}; failed ${data.failed ?? 0}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={syncAll}
        className="flex h-11 items-center justify-center border border-ink px-6 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {busy ? "Syncing…" : "Sync linked to SellerHQ"}
      </button>
      {message && (
        <span className="max-w-xs text-right font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          {message}
        </span>
      )}
    </div>
  );
}
