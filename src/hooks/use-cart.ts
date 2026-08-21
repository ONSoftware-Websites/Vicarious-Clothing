"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface CartLine {
  sku: string;
  qty: number;
}

const KEY = "vc_cart";
const EMPTY: CartLine[] = [];

function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [lines, setLines] = useLocalStorage<CartLine[]>(
    KEY,
    EMPTY,
    parse,
    JSON.stringify
  );

  const add = useCallback(
    (sku: string, qty = 1) => {
      const existing = lines.find((l) => l.sku === sku);
      setLines(
        existing
          ? lines.map((l) => (l.sku === sku ? { ...l, qty: l.qty + qty } : l))
          : [...lines, { sku, qty }]
      );
    },
    [lines, setLines]
  );

  const remove = useCallback(
    (sku: string) => {
      setLines(lines.filter((l) => l.sku !== sku));
    },
    [lines, setLines]
  );

  const setQty = useCallback(
    (sku: string, qty: number) => {
      // Each SKU is a one-of-one piece — quantity is always 1; 0 removes
      const nextQty = qty <= 0 ? 0 : 1;
      if (nextQty === 0) {
        setLines(lines.filter((l) => l.sku !== sku));
        return;
      }
      setLines(lines.map((l) => (l.sku === sku ? { ...l, qty: 1 } : l)));
    },
    [lines, setLines]
  );

  const clear = useCallback(() => {
    setLines([]);
  }, [setLines]);

  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return { lines, count, add, remove, setQty, clear };
}
