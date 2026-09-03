"use client";

import { useCallback, useEffect, useState } from "react";

type Status = { remaining: number; batchSize: number };
type BatchResult = {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
  results?: Array<{ ok: boolean; src?: string; id?: string; error?: string }>;
};

type Job = "migrate" | "variants";

export function ImageMigrationPanel() {
  const [migrationStatus, setMigrationStatus] = useState<Status | null>(null);
  const [variantStatus, setVariantStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<Record<Job, number>>({ migrate: 0, variants: 0 });
  const [failures, setFailures] = useState<string[]>([]);

  const refreshJob = useCallback(async (job: Job) => {
    const endpoint = job === "migrate" ? "/api/admin/images/migrate" : "/api/admin/images/variants";
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Could not inspect ${job} status`);
    const status = data as Status;
    if (job === "migrate") setMigrationStatus(status);
    else setVariantStatus(status);
    return status;
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshJob("migrate"), refreshJob("variants")]);
  }, [refreshJob]);

  useEffect(() => {
    refreshAll().catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [refreshAll]);

  const run = async (job: Job) => {
    setRunning(job);
    setError("");
    setFailures([]);
    setCompleted((current) => ({ ...current, [job]: 0 }));

    const endpoint = job === "migrate" ? "/api/admin/images/migrate" : "/api/admin/images/variants";

    try {
      let remaining = (await refreshJob(job)).remaining;
      while (remaining > 0) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = (await res.json()) as BatchResult & { error?: string };
        if (!res.ok) throw new Error(data.error || `${job} request failed`);

        setCompleted((current) => ({ ...current, [job]: current[job] + data.succeeded }));
        const batchFailures = (data.results ?? [])
          .filter((item) => !item.ok)
          .map((item) => `${item.src || item.id || "image"}: ${item.error || "Unknown error"}`);

        if (batchFailures.length) {
          setFailures((current) => [...current, ...batchFailures]);
          break;
        }

        remaining = data.remaining;
        if (job === "migrate") setMigrationStatus({ remaining, batchSize: 3 });
        else setVariantStatus({ remaining, batchSize: 3 });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(null);
      refreshAll().catch(() => {});
    }
  };

  return (
    <section className="space-y-6">
      <div className="border border-line bg-paper p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Image reliability</p>
        <h2 className="mt-2 font-display text-2xl font-semibold uppercase tracking-tight">Stored image optimization</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
          The storefront now uses lightweight stored thumbnail and display variants with the full WebP kept as a fallback. This reduces simultaneous Storage traffic and protects customers from transient image-rate-limit failures.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <JobCard
          title="Legacy source migration"
          description="Converts any remaining old PNG/JPEG product or journal sources to durable WebP originals."
          remaining={migrationStatus?.remaining ?? null}
          running={running === "migrate"}
          disabled={running !== null}
          completed={completed.migrate}
          onRun={() => run("migrate")}
        />
        <JobCard
          title="Storefront variants"
          description="Creates a 480px thumbnail and 1200px display WebP for each product image. Originals are retained as the recovery/fullscreen source."
          remaining={variantStatus?.remaining ?? null}
          running={running === "variants"}
          disabled={running !== null}
          completed={completed.variants}
          onRun={() => run("variants")}
        />
      </div>

      <button
        type="button"
        disabled={running !== null}
        onClick={() => refreshAll().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
        className="border border-line px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-40"
      >
        Refresh counts
      </button>

      {error && <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {failures.length > 0 && (
        <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Processing stopped because a batch contained failures.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {failures.map((failure) => <li key={failure}>{failure}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

function JobCard({
  title,
  description,
  remaining,
  running,
  disabled,
  completed,
  onRun,
}: {
  title: string;
  description: string;
  remaining: number | null;
  running: boolean;
  disabled: boolean;
  completed: number;
  onRun: () => void;
}) {
  return (
    <div className="border border-line bg-paper p-6">
      <h3 className="font-display text-lg font-semibold uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
      <div className="mt-5 border border-line bg-cream p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Remaining</p>
        <p className="mt-1 font-display text-4xl font-semibold">{remaining === null ? "…" : remaining}</p>
      </div>
      <button
        type="button"
        disabled={disabled || remaining === null || remaining === 0}
        onClick={onRun}
        className="mt-4 bg-ink px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        {running ? "Processing…" : remaining === 0 ? "Complete" : "Run"}
      </button>
      {completed > 0 && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">Completed this run: {completed}</p>
      )}
    </div>
  );
}
