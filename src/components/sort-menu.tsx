"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/site";

export function SortMenu() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "newest";

  return (
    <label className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        Sort
      </span>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", e.target.value);
          router.push(`?${params.toString()}`, { scroll: false });
        }}
        className="h-10 cursor-pointer border border-line bg-paper px-3 font-display text-xs font-medium uppercase tracking-[0.14em] focus:border-ink focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
