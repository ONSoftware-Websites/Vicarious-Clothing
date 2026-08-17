"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";

export function LeadStatusSelect({
  id,
  status,
}: {
  id: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <select
      value={status}
      disabled={busy}
      onChange={async (e) => {
        setBusy(true);
        try {
          await fetch(`/api/admin/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: e.target.value }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
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
