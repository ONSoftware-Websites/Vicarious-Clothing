"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function InventoryActions({ sku }: { sku: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      router.refresh();
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const discount = () => {
    const value = window.prompt("New sale price (£):");
    if (!value) return;
    const price = Number.parseFloat(value);
    if (Number.isNaN(price)) return;
    run(() => post("/api/admin/products", { action: "discount", sku, price }));
  };

  const printLabel = () => {
    const w = window.open("", "_blank", "width=400,height=300");
    if (!w) return;
    w.document.write(`
      <html><head><title>Label ${sku}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 40px; text-align: center; }
        .sku { font-size: 32px; font-weight: bold; letter-spacing: 4px; }
        .brand { margin-top: 10px; font-size: 14px; text-transform: uppercase; }
        .cut { margin-top: 24px; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px; color:#555;}
      </style></head><body>
        <p class="sku">${sku}</p>
        <p class="brand">VICARIOUS CLOTHING</p>
        <p class="cut">✂ cut here ✂</p>
        <script>window.onload = function(){ window.print(); }</script>
      </body></html>
    `);
    w.document.close();
  };

  const btn =
    "font-mono text-[10px] uppercase tracking-[0.12em] underline underline-offset-2 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link
        href={`/admin/inventory/${sku}`}
        className={`${btn} text-accent-deep hover:text-accent-deep`}
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => post("/api/admin/products", { action: "sync_sellerhq", sku }))}
        className={`${btn} text-accent-deep hover:text-accent-deep disabled:opacity-40`}
      >
        Sync SHQ
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => post("/api/admin/products", { action: "duplicate", sku }))}
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Duplicate
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(() => post("/api/admin/products", { action: "status", sku, status: "SOLD" }))
        }
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Mark sold
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(() => post("/api/admin/products", { action: "status", sku, status: "ARCHIVED" }))
        }
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Archive
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(() => post("/api/admin/products", { action: "status", sku, status: "AVAILABLE" }))
        }
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Relist
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={discount}
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Discount
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={printLabel}
        className={`${btn} text-ink-soft hover:text-ink disabled:opacity-40`}
      >
        Print label
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (!window.confirm(`Delete ${sku}? This cannot be undone.`)) return;
          run(() => post("/api/admin/products", { action: "delete", sku }));
        }}
        className={`${btn} text-red-700 hover:text-red-800 disabled:opacity-40`}
      >
        Delete
      </button>
      {error && <span className="font-mono text-[10px] text-red-700">{error}</span>}
    </div>
  );
}
