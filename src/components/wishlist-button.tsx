"use client";

import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  sku,
  className,
  sold = false,
}: {
  sku: string;
  className?: string;
  sold?: boolean;
}) {
  const { has, toggle } = useWishlist();
  const active = has(sku);

  return (
    <button
      type="button"
      onClick={() => toggle(sku)}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 items-center justify-center transition-colors",
        active ? "text-accent-deep" : "text-ink",
        sold && "text-paper",
        className
      )}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 20.5C7 16.5 3.5 13.2 3.5 9.5C3.5 6.5 5.7 4.5 8.3 4.5C9.9 4.5 11.2 5.3 12 6.6C12.8 5.3 14.1 4.5 15.7 4.5C18.3 4.5 20.5 6.5 20.5 9.5C20.5 13.2 17 16.5 12 20.5Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );
}
