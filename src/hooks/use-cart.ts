"use client";

import { useCallback, useMemo } from "react";
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
    return Array.isArray(parsed)
      ? normalizeLines(parsed.filter((line) => line && typeof line.sku === "string"))
      : [];
  } catch {
    return [];
  }
}

function normalizeLines(lines: CartLine[]) {
  return [...new Set(lines.map((line) => line.sku.trim().toUpperCase()).filter(Boolean))].map(sku => ({sku,qty:1}));
}

export function useCart() {
  const [storedLines, setLines] = useLocalStorage<CartLine[]>(
    KEY,
    EMPTY,
    parse,
    JSON.stringify
  );

  const lines = useMemo(() => normalizeLines(storedLines), [storedLines]);

  const add = useCallback(
    (sku: string) => {
      const normalizedSku = sku.trim().toUpperCase();
      if (!normalizedSku) return;
      if (lines.some((line) => line.sku === normalizedSku)) {
        setLines(lines.map((line) => ({ ...line, qty: 1 })));
        return;
      }
      setLines([...lines.map((line) => ({ ...line, qty: 1 })), { sku: normalizedSku, qty: 1 }]);
    },
    [lines, setLines]
  );

  const remove = useCallback(
    (sku: string) => {
      setLines(lines.filter((l) => l.sku !== sku.trim().toUpperCase()));
    },
    [lines, setLines]
  );

  const setQty = useCallback(
    (sku: string, qty: number) => {
      const normalizedSku = sku.trim().toUpperCase();
      // Each SKU is a one-of-one piece — quantity is always 1; 0 removes.
      const nextQty = qty <= 0 ? 0 : 1;
      if (nextQty === 0) {
        setLines(lines.filter((l) => l.sku !== normalizedSku));
        return;
      }
      setLines(lines.map((l) => (l.sku === normalizedSku ? { ...l, qty: 1 } : { ...l, qty: 1 })));
    },
    [lines, setLines]
  );

  const clear = useCallback(() => {
    setLines([]);
  }, [setLines]);

  const count = lines.length;

  return { lines, count, add, remove, setQty, clear };
}
