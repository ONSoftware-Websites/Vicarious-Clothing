"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const input =
  "h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none";
const label =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft";

export function PurchaseForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    sellerName: "",
    sellerEmail: "",
    amount: "",
    notes: "",
    items: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const itemLines = form.items
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [sku, cost] = line.split(/[,\s]+/);
          return { sku: sku.toUpperCase(), cost: Number.parseFloat(cost) || 0 };
        });

      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          purchase: {
            sellerName: form.sellerName,
            sellerEmail: form.sellerEmail,
            amount: Number.parseFloat(form.amount) || 0,
            notes: form.notes,
            items: itemLines,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setForm({ sellerName: "", sellerEmail: "", amount: "", notes: "", items: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-line p-5">
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em]">
        Record a stock purchase
      </h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="pu-seller" className={label}>Seller name</label>
          <input
            id="pu-seller"
            value={form.sellerName}
            onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
            className={input}
            required
          />
        </div>
        <div>
          <label htmlFor="pu-email" className={label}>Seller email</label>
          <input
            id="pu-email"
            type="email"
            value={form.sellerEmail}
            onChange={(e) => setForm((f) => ({ ...f, sellerEmail: e.target.value }))}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="pu-amount" className={label}>Agreed amount (£)</label>
          <input
            id="pu-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className={input}
            required
          />
        </div>
        <div>
          <label htmlFor="pu-notes" className={label}>Notes</label>
          <input
            id="pu-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={input}
            placeholder="Collected in person…"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="pu-items" className={label}>
            Items — one per line: SKU cost (e.g. VC-000381 18)
          </label>
          <textarea
            id="pu-items"
            rows={3}
            value={form.items}
            onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
            className="w-full border border-line bg-paper p-3 font-mono text-xs focus:border-ink focus:outline-none"
            placeholder={"VC-000381 18\nVC-000434 3"}
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 font-mono text-[10px] uppercase text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex h-11 items-center justify-center bg-accent px-8 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
      >
        {busy ? "Saving…" : "Record purchase"}
      </button>
    </form>
  );
}
