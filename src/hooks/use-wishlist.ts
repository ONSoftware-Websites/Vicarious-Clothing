"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const KEY = "vc_wishlist";
const EMPTY: string[] = [];

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [skus, setSkus] = useLocalStorage<string[]>(
    KEY,
    EMPTY,
    parse,
    JSON.stringify
  );

  const toggle = useCallback(
    (sku: string) => {
      setSkus(
        skus.includes(sku) ? skus.filter((s) => s !== sku) : [...skus, sku]
      );
    },
    [skus, setSkus]
  );

  const has = useCallback((sku: string) => skus.includes(sku), [skus]);

  const remove = useCallback(
    (sku: string) => {
      setSkus(skus.filter((s) => s !== sku));
    },
    [skus, setSkus]
  );

  return { skus, has, toggle, remove, count: skus.length };
}
