"use client";

import { useState, type FormEvent } from "react";
import { CONDITIONS, type Condition } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/utils";

interface FormState {
  name: string;
  email: string;
  brand: string;
  itemType: string;
  size: string;
  condition: string;
  notes: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  brand: "",
  itemType: "",
  size: "",
  condition: "",
  notes: "",
};

export function SellToUsForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="border border-line bg-cream p-8 text-center sm:p-12">
        <p className="font-display text-2xl font-semibold uppercase tracking-tight">
          Got it. We&apos;ll take a look.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          Thanks for the submission — we&apos;ll get back to you within a
          couple of working days with an offer or a no, either way.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-display text-lg font-semibold uppercase">
          That didn&apos;t go through.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Please try again, or email us at hello@vicariousclothing.co.uk.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 border border-ink px-6 py-3 font-display text-xs font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-paper"
        >
          Try again
        </button>
      </div>
    );
  }

  const input =
    "h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="stu-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Name
          </label>
          <input
            id="stu-name"
            required
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            className={input}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="stu-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Email
          </label>
          <input
            id="stu-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            className={input}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="stu-brand" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Brand
          </label>
          <input
            id="stu-brand"
            required
            value={form.brand}
            onChange={(e) => set("brand")(e.target.value)}
            className={input}
            placeholder="Carhartt, Nike, Stussy…"
          />
        </div>
        <div>
          <label htmlFor="stu-type" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Item type
          </label>
          <input
            id="stu-type"
            required
            value={form.itemType}
            onChange={(e) => set("itemType")(e.target.value)}
            className={input}
            placeholder="Jacket, hoodie, trainers…"
          />
        </div>
        <div>
          <label htmlFor="stu-size" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Size
          </label>
          <input
            id="stu-size"
            required
            value={form.size}
            onChange={(e) => set("size")(e.target.value)}
            className={input}
            placeholder="M, UK 9, 32/32…"
          />
        </div>
        <div>
          <label htmlFor="stu-condition" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Condition
          </label>
          <select
            id="stu-condition"
            required
            value={form.condition}
            onChange={(e) => set("condition")(e.target.value)}
            className={input}
          >
            <option value="" disabled>
              Roughly how is it?
            </option>
            {CONDITIONS.map((c: Condition) => (
              <option key={c} value={CONDITION_LABELS[c]}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="stu-photos" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          Photographs
        </label>
        <div className="flex h-28 w-full cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-cream text-center hover:border-ink">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em]">
            Drop photos here or browse
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            A few clear shots help a lot
          </p>
          <input
            id="stu-photos"
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
          />
        </div>
      </div>

      <div>
        <label htmlFor="stu-notes" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
          Anything we should know?
        </label>
        <textarea
          id="stu-notes"
          rows={4}
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          className="w-full border border-line bg-paper p-4 text-sm focus:border-ink focus:outline-none"
          placeholder="Defects, age, what you'd like for it…"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-14 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent disabled:opacity-50 sm:w-auto sm:px-14"
      >
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
