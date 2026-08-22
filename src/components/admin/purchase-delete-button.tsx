"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PurchaseDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Delete this purchase?")) return;
        setBusy(true);
        await fetch(`/api/admin/purchases?id=${id}`, { method: "DELETE" });
        router.refresh();
        setBusy(false);
      }}
      className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-40"
    >
      Delete
    </button>
  );
}
