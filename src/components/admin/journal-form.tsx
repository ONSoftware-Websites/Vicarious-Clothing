"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JournalPost } from "@/lib/types";

const input =
  "h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none";
const label =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft";

export function JournalForm({ editing }: { editing?: JournalPost }) {
  const router = useRouter();
  const [form, setForm] = useState({
    id: editing?.id ?? "",
    slug: editing?.slug ?? "",
    title: editing?.title ?? "",
    excerpt: editing?.excerpt ?? "",
    body: editing?.body.join("\n\n") ?? "",
    coverImage: editing?.coverImage ?? "",
    published: editing?.published ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (publish: boolean) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          post: {
            ...form,
            id: form.id || undefined,
            body: form.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
            coverImage: form.coverImage || undefined,
            published: form.published || publish,
            publishedAt: form.published || publish ? editing?.publishedAt ?? new Date().toISOString() : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setForm((f) => ({ ...f, id: "", slug: "", title: "", excerpt: "", body: "", coverImage: "", published: false }));
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
        save(true);
      }}
      className="border border-line p-5"
    >
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em]">
        {editing ? `Edit: ${editing.title}` : "New journal post"}
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="jr-title" className={label}>Title</label>
            <input
              id="jr-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={input}
              required
            />
          </div>
          <div>
            <label htmlFor="jr-cover" className={label}>Cover image URL</label>
            <input
              id="jr-cover"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              className={input}
              placeholder="https://… (leave blank for placeholder)"
            />
          </div>
        </div>
        <div>
          <label htmlFor="jr-excerpt" className={label}>Excerpt</label>
          <input
            id="jr-excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className={input}
            placeholder="One sentence that sells the read."
          />
        </div>
        <div>
          <label htmlFor="jr-body" className={label}>
            Body — paragraphs separated by a blank line
          </label>
          <textarea
            id="jr-body"
            rows={10}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full border border-line bg-paper p-3 text-sm leading-relaxed focus:border-ink focus:outline-none"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="h-4 w-4 accent-[#0097af]"
          />
          Published (visible on the site)
        </label>
      </div>
      {error && (
        <p className="mt-3 font-mono text-[10px] uppercase text-red-700">{error}</p>
      )}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          className="flex h-11 items-center justify-center border border-ink px-6 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 items-center justify-center bg-accent px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
        >
          {busy ? "Saving…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
