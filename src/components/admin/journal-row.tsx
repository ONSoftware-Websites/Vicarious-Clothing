"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JournalRow({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        setBusy(true);
        try {
          await fetch("/api/admin/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
