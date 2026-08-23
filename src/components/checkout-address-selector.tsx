"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/hooks/use-account";
import type { Address } from "@/lib/types";

export function CheckoutAddressSelector({
  onSelect,
}: {
  onSelect: (addr: Address) => void;
}) {
  const { user } = useAccount();
  const [addresses, setAddresses] = useState<(Address & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">Loading addresses…</p>;
  if (!user || addresses.length === 0) return null;

  return (
    <div className="mb-6 border border-line bg-cream p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Saved addresses</p>
      <div className="grid gap-2">
        {addresses.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a)}
            className="border border-line bg-paper p-3 text-left text-sm hover:border-ink"
          >
            <span className="font-medium">{a.line1}</span>
            {a.line2 && <span>, {a.line2}</span>}
            <span>, {a.city}, {a.postcode}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
