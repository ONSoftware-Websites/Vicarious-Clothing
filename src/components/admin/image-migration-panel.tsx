"use client";

import { useCallback, useEffect, useState } from "react";

type Status = { remaining: number; batchSize: number };
type BatchResult = {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
  results?: Array<{ ok: boolean; src: string; error?: string; before?: number; after?: number }>;
};

export function ImageMigrationPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [migrated, setMigrated] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/images/migrate", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not inspect image migration status");
    setStatus(data as Status);
    return data as Status;
  }, []);

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [refresh]);

  const run = async () => {
    setRunning(true);
    setError("");
    setFailures([]);
    setMigrated(0);

    try {
      let remaining = (await refresh()).remaining;
      while (remaining > 0) {
        const res = await fetch("/api/admin/images/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = (await res.json()) as BatchResult & { error?: string };
        if (!res.ok) throw new Error(data.error || "Image migration request failed");

        setMigrated((count) => count + data.succeeded);
        const batchFailures = (data.results ?? [])
          .filter((item) => !item.ok)
          .map((item) => `${item.src}: ${item.error || "Unknown error"}`);
        if (batchFailures.length) {
          setFailures((current) => [...current, ...batchFailures]);
          setStatus({ remaining: data.remaining, batchSize: 3 });
          break;
        }

        remaining = data.remaining;
        setStatus({ remaining, batchSize: 3 });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      refresh().catch(() => {});
    }
  };

  const remaining = status?.remaining ?? null;

  return (
    <section className="border border-line bg-paper p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">One-time maintenance</p>
          <h2 className="mt-2 font-display text-2xl font-semibold uppercase tracking-tight">Existing image migration</h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Converts existing Supabase product and journal images to the same bounded WebP format used by new uploads, updates catalogue and historical order references, then removes the old source only after the database references have moved.
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            This is intentionally manual and admin-only. You only need to run it once after the self-managed image optimization rollout.
          </p>
        </div>

        <div className="min-w-[240px] border border-line bg-cream p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Remaining</p>
          <p className="mt-1 font-display text-4xl font-semibold">{remaining === null ? "…" : remaining}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">eligible stored images</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={running || remaining === null || remaining === 0}
          onClick={run}
          className="bg-ink px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "Migrating…" : remaining === 0 ? "Migration complete" : "Run migration"}
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => refresh().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
          className="border border-line px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em]"
        >
          Refresh count
        </button>
        {migrated > 0 && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">Migrated this run: {migrated}</span>}
      </div>

      {error && <p className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {failures.length > 0 && (
        <div className="mt-4 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Migration stopped because a batch contained failures.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {failures.map((failure) => <li key={failure}>{failure}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
