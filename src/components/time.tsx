"use client";

import { useEffect, useState } from "react";

export function Now() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span data-suppress-hydration-warning>…</span>;

  return <time dateTime={now.toISOString()}>{now.toLocaleString()}</time>;
}

export function FormatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return <span data-suppress-hydration-warning>—</span>;
  return <time dateTime={d.toISOString()}>{d.toLocaleDateString("en-GB", options)}</time>;
}

interface DateProps { date: string | Date }

export function FormatDateTime({ date }: DateProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return <span data-suppress-hydration-warning>—</span>;
  return (
    <time dateTime={d.toISOString()}>
      {d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}