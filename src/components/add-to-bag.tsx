"use client";

import { useCart } from "@/hooks/use-cart";
import { useShopUi } from "@/hooks/use-shop-ui";

export function AddToBag({
  sku,
  disabled = false,
  label = "Add to bag",
  fullWidth = true,
}: {
  sku: string;
  disabled?: boolean;
  label?: string;
  fullWidth?: boolean;
}) {
  const { add } = useCart();
  const { openBag } = useShopUi();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(sku);
        openBag();
      }}
      className={
        fullWidth
          ? "flex h-14 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-ink-faint"
          : "flex h-12 items-center justify-center bg-ink px-8 font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-ink-faint"
      }
    >
      {label}
    </button>
  );
}
