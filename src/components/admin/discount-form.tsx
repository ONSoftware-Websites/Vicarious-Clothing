"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Discount, DiscountType } from "@/lib/types";

const input =
  "h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none";
const label =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft";

export function DiscountForm({ editing }: { editing?: Discount }) {
  const router = useRouter();
  const [form, setForm] = useState({
    id: editing?.id ?? "",
    code: editing?.code ?? "",
    type: (editing?.type ?? "percentage") as DiscountType,
    value: editing ? String(editing.value) : "",
    description: editing?.description ?? "",
    minBasket: editing?.minBasket !== undefined ? String(editing.minBasket) : "",
    categories: editing?.categories?.join(", ") ?? "",
    expiresAt: editing?.expiresAt ? editing.expiresAt.slice(0, 10) : "",
    usageLimit: editing?.usageLimit !== undefined ? String(editing.usageLimit) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          discount: {
            ...form,
            id: form.id || undefined,
            minBasket: form.minBasket ? Number(form.minBasket) : undefined,
            usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
            categories: form.categories
              ? form.categories.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
              : undefined,
            value: Number(form.value || 0),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setForm((f) => ({ ...f, id: "", code: "", value: "", description: "", minBasket: "", categories: "", expiresAt: "", usageLimit: "" }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="border border-line p-5"
    >
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em]">
        {editing ? `Edit ${editing.code}` : "New discount code"}
      </h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="dc-code" className={label}>Code</label>
          <input
            id="dc-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            className={input}
            placeholder="DROP10"
            required
          />
        </div>
        <div>
          <label htmlFor="dc-type" className={label}>Type</label>
          <select
            id="dc-type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={input}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed value</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </div>
        <div>
          <label htmlFor="dc-value" className={label}>
            Value ({form.type === "percentage" ? "%" : "£"})
          </label>
          <input
            id="dc-value"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled={form.type === "free_delivery"}
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            className={`${input} disabled:bg-cream disabled:text-ink-faint`}
            placeholder="10"
            required={form.type !== "free_delivery"}
          />
        </div>
        <div>
          <label htmlFor="dc-desc" className={label}>Description</label>
          <input
            id="dc-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={input}
            placeholder="10% off your first order"
          />
        </div>
        <div>
          <label htmlFor="dc-min" className={label}>Minimum basket (£)</label>
          <input
            id="dc-min"
            type="number"
            inputMode="decimal"
            value={form.minBasket}
            onChange={(e) => set("minBasket", e.target.value)}
            className={input}
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="dc-cats" className={label}>Categories only (comma)</label>
          <input
            id="dc-cats"
            value={form.categories}
            onChange={(e) => set("categories", e.target.value)}
            className={input}
            placeholder="jackets, hoodies"
          />
        </div>
        <div>
          <label htmlFor="dc-expiry" className={label}>Expiry date</label>
          <input
            id="dc-expiry"
            type="date"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="dc-limit" className={label}>Usage limit</label>
          <input
            id="dc-limit"
            type="number"
            inputMode="numeric"
            value={form.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)}
            className={input}
            placeholder="Optional"
          />
        </div>
      </div>
      {error && <p className="mt-3 font-mono text-[10px] uppercase text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex h-11 items-center justify-center bg-accent px-8 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
      >
        {busy ? "Saving…" : editing ? "Save changes" : "Create code"}
      </button>
    </form>
  );
}

export function DiscountRow({ discount }: { discount: Discount }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => run({ action: "toggle", id: discount.id })}
        className={
          discount.active
            ? "border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800 hover:border-emerald-400"
            : "border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint hover:border-ink"
        }
      >
        {discount.active ? "Active" : "Paused"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run({ action: "delete", id: discount.id })}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
