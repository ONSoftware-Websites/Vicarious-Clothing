"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useShopUi } from "@/hooks/use-shop-ui";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 20.5C7 16.5 3.5 13.2 3.5 9.5C3.5 6.5 5.7 4.5 8.3 4.5C9.9 4.5 11.2 5.3 12 6.6C12.8 5.3 14.1 4.5 15.7 4.5C18.3 4.5 20.5 6.5 20.5 9.5C20.5 13.2 17 16.5 12 20.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8H18L17.2 20H6.8L6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 8V6.5C9 4.8 10.3 3.5 12 3.5C13.7 3.5 15 4.8 15 6.5V8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Header() {
  const { openSearch, openBag, toggleMenu, menuOpen, closeAll } = useShopUi();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-paper/95 backdrop-blur transition-all duration-200",
        scrolled
          ? "border-line shadow-[0_1px_0_0_rgba(16,16,20,0.04)]"
          : "border-transparent"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 transition-all duration-200 sm:px-6 lg:px-10",
          scrolled ? "h-14" : "h-16 sm:h-20"
        )}
      >
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center md:hidden"
          onClick={toggleMenu}
          aria-label="Open menu"
        >
          <IconMenu />
        </button>

        <Link
          href="/"
          className="font-display text-xl font-bold uppercase tracking-[0.08em] sm:text-2xl"
        >
          Vicarious
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-display text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:text-accent-deep",
                pathname.startsWith(link.href) && link.href !== "/about"
                  ? "text-accent-deep"
                  : "text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:text-accent-deep"
            onClick={openSearch}
            aria-label="Open search"
          >
            <IconSearch />
          </button>
          <Link
            href="/account/wishlist"
            className="relative hidden h-10 w-10 items-center justify-center transition-colors hover:text-accent-deep sm:flex"
            aria-label={`Wishlist, ${wishCount} items`}
          >
            <IconHeart />
            {wishCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-deep px-1 font-mono text-[9px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center transition-colors hover:text-accent-deep"
            onClick={openBag}
            aria-label={`Open bag, ${count} items`}
          >
            <IconBag />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-deep px-1 font-mono text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-line py-3 font-display text-sm font-medium uppercase tracking-[0.18em]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              className="border-b border-line py-3 font-display text-sm font-medium uppercase tracking-[0.18em]"
            >
              Account
            </Link>
            <Link
              href="/sell-to-us"
              className="py-3 font-display text-sm font-medium uppercase tracking-[0.18em] text-accent-deep"
            >
              Sell to us
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
