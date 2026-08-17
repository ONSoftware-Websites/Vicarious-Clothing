"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { CONDITIONS, type Condition } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/utils";

export interface Facets {
  brands: string[];
  sizes: string[];
  conditions: string[];
  colours: string[];
  minPrice: number;
  maxPrice: number;
}

interface FiltersProps {
  facets: Facets;
  className?: string;
  onApply?: () => void;
  idPrefix?: string;
}

function useToggleParam() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const existing = (params.get(key) ?? "").split(",").filter(Boolean);
      if (existing.includes(value)) {
        params.set(key, existing.filter((v) => v !== value).join(","));
        if (!params.get(key)) params.delete(key);
      } else {
        params.set(key, [...existing, value].join(","));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.18em]">
        {title}
      </legend>
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                className="h-3.5 w-3.5 accent-[#0097af]"
              />
              {option}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function PriceRange({
  initialMin,
  initialMax,
  facets,
  onApply,
  idPrefix,
}: {
  initialMin: string;
  initialMax: string;
  facets: Facets;
  onApply: () => void;
  idPrefix: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("min", minPrice);
    else params.delete("min");
    if (maxPrice) params.set("max", maxPrice);
    else params.delete("max");
    router.push(`?${params.toString()}`, { scroll: false });
    onApply();
  };

  return (
    <fieldset className="border-b border-line py-5">
      <legend className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.18em]">
        Price
      </legend>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${idPrefix}-min`}>
          Minimum price
        </label>
        <input
          id={`${idPrefix}-min`}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={`£${facets.minPrice}`}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="h-10 w-full border border-line bg-paper px-3 font-mono text-xs focus:border-ink focus:outline-none"
        />
        <span className="text-ink-faint">–</span>
        <label className="sr-only" htmlFor={`${idPrefix}-max`}>
          Maximum price
        </label>
        <input
          id={`${idPrefix}-max`}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={`£${facets.maxPrice}`}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="h-10 w-full border border-line bg-paper px-3 font-mono text-xs focus:border-ink focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={applyPrice}
        className="mt-3 w-full border border-ink py-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper"
      >
        Apply price
      </button>
    </fieldset>
  );
}

export function Filters({ facets, className, onApply, idPrefix = "filters" }: FiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toggle = useToggleParam();

  const brands = (searchParams.get("brand") ?? "").split(",").filter(Boolean);
  const sizes = (searchParams.get("size") ?? "").split(",").filter(Boolean);
  const conditions = (searchParams.get("condition") ?? "")
    .split(",")
    .filter(Boolean);
  const colours = (searchParams.get("colour") ?? "").split(",").filter(Boolean);

  const activeCount =
    brands.length + sizes.length + conditions.length + colours.length +
    (searchParams.get("min") ? 1 : 0) + (searchParams.get("max") ? 1 : 0);

  const clearAll = () => {
    const keep = searchParams.get("q");
    const params = new URLSearchParams();
    if (keep) params.set("q", keep);
    router.push(params.toString() ? `?${params.toString()}` : "?", {
      scroll: false,
    });
    onApply?.();
  };

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
          Filter
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup title="Brand" options={facets.brands} selected={brands} onToggle={(v) => toggle("brand", v)} />
      <FilterGroup title="Size" options={facets.sizes} selected={sizes} onToggle={(v) => toggle("size", v)} />
      <FilterGroup
        title="Condition"
        options={[...CONDITIONS.map((c: Condition) => CONDITION_LABELS[c])].sort()}
        selected={conditions.map((c) => CONDITION_LABELS[c as Condition] ?? c)}
        onToggle={(v) => {
          const raw = Object.entries(CONDITION_LABELS).find(
            ([, label]) => label === v
          )?.[0];
          if (raw) toggle("condition", raw);
        }}
      />
      <FilterGroup title="Colour" options={facets.colours} selected={colours} onToggle={(v) => toggle("colour", v)} />

      <PriceRange
        key={`${searchParams.get("min") ?? ""}-${searchParams.get("max") ?? ""}`}
        initialMin={searchParams.get("min") ?? ""}
        initialMax={searchParams.get("max") ?? ""}
        facets={facets}
        onApply={() => onApply?.()}
        idPrefix={idPrefix}
      />
    </div>
  );
}
