"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_LAUNCH_AT = "2026-09-02T11:00:00.000Z";

function getTargetTime() {
  const configured = process.env.NEXT_PUBLIC_LAUNCH_AT ?? DEFAULT_LAUNCH_AT;
  const parsed = Date.parse(configured);
  return Number.isFinite(parsed) ? parsed : Date.parse(DEFAULT_LAUNCH_AT);
}

function splitTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function LaunchCountdown() {
  const target = useMemo(() => getTargetTime(), []);
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = target - Date.now();
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(interval);
        window.location.reload();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [target]);

  const parts = splitTime(remaining);
  const units = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {units.map(([label, value]) => (
        <div key={label} className="border border-paper/20 bg-paper/10 p-4 text-center backdrop-blur-sm">
          <p className="font-display text-3xl font-semibold tabular-nums text-paper sm:text-4xl">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
