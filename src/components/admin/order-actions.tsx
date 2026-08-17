"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/lib/types";

const STATUS_FLOW: Array<{ status: OrderStatus; label: string }> = [
  { status: "PAID", label: "Paid" },
  { status: "PICKING", label: "Start picking" },
  { status: "READY_TO_DISPATCH", label: "Ready to dispatch" },
  { status: "DISPATCHED", label: "Mark dispatched" },
  { status: "DELIVERED", label: "Mark delivered" },
];

const BRANCHES: Array<{ status: OrderStatus; label: string }> = [
  { status: "RETURN_REQUESTED", label: "Return requested" },
  { status: "RETURNED", label: "Returned" },
  { status: "REFUNDED", label: "Refunded" },
  { status: "CANCELLED", label: "Cancel" },
];

export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState("");

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setError("That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  const flowIndex = STATUS_FLOW.findIndex((s) => s.status === status);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Move order
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.map((step, i) => {
            const done = i <= flowIndex;
            const next = i === flowIndex + 1;
            return (
              <button
                key={step.status}
                type="button"
                disabled={busy || done || !next}
                onClick={() => patch({ status: step.status })}
                className={
                  done
                    ? "border border-emerald-200 bg-emerald-50 px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800"
                    : next
                      ? "border border-ink bg-ink px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent"
                      : "border border-line px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint opacity-50"
                }
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Branches
        </p>
        <div className="flex flex-wrap gap-2">
          {BRANCHES.filter((b) => b.status !== status).map((branch) => (
            <button
              key={branch.status}
              type="button"
              disabled={busy}
              onClick={() => patch({ status: branch.status })}
              className="border border-line px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {branch.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Tracking
        </p>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`tracking-${id}`}>
            Tracking number
          </label>
          <input
            id={`tracking-${id}`}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="RM482910376GB"
            className="h-11 w-full max-w-xs border border-line bg-paper px-3 font-mono text-xs uppercase focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !tracking.trim()}
            onClick={() =>
              patch({ carrier: "Royal Mail Tracked 48", tracking: tracking.trim() })
            }
            className="h-11 border border-ink px-5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {error && <p className="font-mono text-[10px] uppercase text-red-700">{error}</p>}
    </div>
  );
}
