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
  const [photos, setPhotos] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (photos.length === 0) {
      setError("Please add at least one clear photograph of the item.");
      return;
    }
    if (photos.length > 6) {
      setError("Please upload no more than six photographs.");
      return;
    }

    setStatus("sending");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(form)) body.append(key, value);
      for (const photo of photos) body.append("photos", photo);

      const res = await fetch("/api/leads", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
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
          Thanks for the submission — we&apos;ll get back to you within a couple of working days with an offer or a no, either way.
        </p>
      </div>
    );
  }

  const input =
    "h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="stu-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Name</label>
          <input id="stu-name" required value={form.name} onChange={(e) => set("name")(e.target.value)} className={input} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="stu-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Email</label>
          <input id="stu-email" type="email" required value={form.email} onChange={(e) => set("email")(e.target.value)} className={input} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="stu-brand" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Brand</label>
          <input id="stu-brand" required value={form.brand} onChange={(e) => set("brand")(e.target.value)} className={input} placeholder="Carhartt, Nike, Stussy…" />
        </div>
        <div>
          <label htmlFor="stu-type" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Item type</label>
          <input id="stu-type" required value={form.itemType} onChange={(e) => set("itemType")(e.target.value)} className={input} placeholder="Jacket, hoodie, trainers…" />
        </div>
        <div>
          <label htmlFor="stu-size" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Size</label>
          <input id="stu-size" required value={form.size} onChange={(e) => set("size")(e.target.value)} className={input} placeholder="M, UK 9, 32/32…" />
        </div>
        <div>
          <label htmlFor="stu-condition" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Condition</label>
          <select id="stu-condition" required value={form.condition} onChange={(e) => set("condition")(e.target.value)} className={input}>
            <option value="" disabled>Roughly how is it?</option>
            {CONDITIONS.map((c: Condition) => (
              <option key={c} value={CONDITION_LABELS[c]}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Photographs</p>
        <label htmlFor="stu-photos" className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-cream p-4 text-center hover:border-ink">
          <p className="font-display text-xs font-medium uppercase tracking-[0.16em]">Choose photos</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">1–6 images · up to 8 MB each</p>
          {photos.length > 0 && (
            <p className="mt-3 text-xs text-ink-soft">{photos.length} {photos.length === 1 ? "photo" : "photos"} selected</p>
          )}
          <input
            id="stu-photos"
            type="file"
            multiple
            required
            accept="image/*"
            className="sr-only"
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 6))}
          />
        </label>
      </div>

      <div>
        <label htmlFor="stu-notes" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Anything we should know?</label>
        <textarea id="stu-notes" rows={4} value={form.notes} onChange={(e) => set("notes")(e.target.value)} className="w-full border border-line bg-paper p-4 text-sm focus:border-ink focus:outline-none" placeholder="Defects, age, what you'd like for it…" />
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-14 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent disabled:opacity-50 sm:w-auto sm:px-14"
      >
        {status === "sending" ? "Sending…" : status === "error" ? "Try again" : "Submit"}
      </button>
    </form>
  );
}
