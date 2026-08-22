"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShopUi } from "@/hooks/use-shop-ui";
import { CATEGORY_LABELS, TRENDING_TERMS } from "@/lib/site";
import { conditionLabel, formatPrice } from "@/lib/utils";

interface SearchResult {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  condition: string;
  image: string;
  status: string;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ query: string; items: SearchResult[] } | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const raw = localStorage.getItem("vc_recent_searches");
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {}
  }, []);

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem("vc_recent_searches", JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!cancelled) setResults({ query, items: data.results });
      } catch {
        // ignored
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [q]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    saveRecent(term);
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const currentQuery = q.trim();
  const currentResults =
    results && results.query === currentQuery ? results.items : [];
  const searching = currentQuery.length > 0 && results?.query !== currentQuery;

  return (
    <div
      className="mx-auto flex min-h-[60vh] flex-col bg-paper md:mt-16 md:max-h-[80vh] md:max-w-3xl md:border md:border-line"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-line p-6 md:p-8">
        <form onSubmit={submit} className="flex items-center gap-4">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brands, products, categories..."
            aria-label="Search brands, products, categories"
            className="w-full bg-transparent font-display text-lg font-medium uppercase tracking-wide placeholder:text-ink-faint focus:outline-none sm:text-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-accent-deep"
          >
            Esc
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {currentQuery === "" ? (
          <div className="space-y-8">
            {recent.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">Recent</p>
                  <button type="button" onClick={() => { setRecent([]); try { localStorage.removeItem("vc_recent_searches"); } catch {} }} className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint underline underline-offset-2">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} onClick={onClose} className="border border-line px-4 py-2 font-display text-xs uppercase tracking-[0.14em] hover:border-ink hover:bg-ink hover:text-paper">
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">Trending</p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TERMS.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    onClick={() => { saveRecent(term); onClose(); }}
                    className="border border-line px-4 py-2 font-display text-xs uppercase tracking-[0.14em] transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">Browse</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <Link key={key} href={`/shop/${key}`} onClick={onClose} className="border border-line px-4 py-2 font-display text-xs uppercase tracking-[0.14em] hover:border-ink hover:bg-ink hover:text-paper">{label}</Link>
                ))}
                <Link href="/shop/sale" onClick={onClose} className="border border-accent bg-accent px-4 py-2 font-display text-xs uppercase tracking-[0.14em] text-white hover:bg-accent-deep">Sale</Link>
                <Link href="/brands" onClick={onClose} className="border border-line px-4 py-2 font-display text-xs uppercase tracking-[0.14em] hover:border-ink hover:bg-ink hover:text-paper">Brands</Link>
                <Link href="/journal" onClick={onClose} className="border border-line px-4 py-2 font-display text-xs uppercase tracking-[0.14em] hover:border-ink hover:bg-ink hover:text-paper">Journal</Link>
              </div>
            </div>
          </div>
        ) : searching ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
            Searching…
          </p>
        ) : currentResults.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-display text-lg font-semibold uppercase">
              Nothing matched that.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Try another search or browse everything.
            </p>
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-6 inline-block border border-ink px-6 py-3 font-display text-xs font-medium uppercase tracking-[0.14em] hover:bg-ink hover:text-paper"
            >
              Browse everything
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {currentResults.map((r) => (
              <li key={r.sku}>
                <Link
                  href={`/product/${r.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 py-3 transition-colors hover:bg-cream"
                >
                  <Image
                    src={r.image}
                    alt={r.name}
                    width={56}
                    height={70}
                    className="h-[70px] w-14 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                      {r.brand}
                    </p>
                    <p className="font-display text-sm font-medium">{r.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      {r.sku} / {conditionLabel(r.condition as never).toUpperCase()}
                      {r.status === "SOLD" && " / SOLD"}
                    </p>
                  </div>
                  <p className="font-mono text-sm">{formatPrice(r.price)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useShopUi();

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [searchOpen, closeSearch]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
      onClick={closeSearch}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <SearchPanel onClose={closeSearch} />
    </div>
  );
}
