"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InventoryDeleteButton({ sku }: { sku: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Delete ${sku}? This cannot be undone.`)) return;
        setBusy(true);
        await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", sku }),
        });
        router.push("/admin/inventory");
        router.refresh();
      }}
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-700 underline underline-offset-2 hover:text-red-800 disabled:opacity-40"
    >
      Delete product
    </button>
  );
}
