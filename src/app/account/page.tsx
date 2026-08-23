"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account-shell";
import { useAccount } from "@/hooks/use-account";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export default function AccountPage() {
  const { profile, loading: accountLoading } = useAccount();
  const { count: wishCount } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accountLoading) return;
    if (!profile?.email) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setOrders(data.orders ?? []); })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profile?.email, accountLoading]);

  return (
    <AccountShell>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-line bg-cream p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Orders
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {loading ? "…" : orders.length}
          </p>
        </div>
        <div className="border border-line bg-cream p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Wishlist
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">{wishCount}</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
            Recent orders
          </h2>
          <Link
            href="/account/orders"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint underline underline-offset-4 hover:text-accent-deep"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            Loading…
          </p>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-line p-10 text-center">
            <p className="font-display text-sm font-semibold uppercase">
              No orders yet
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              When you order something, it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/order/${order.id}`}
                  className="flex items-center justify-between py-4 transition-colors hover:bg-cream"
                >
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.14em]">
                      {order.id}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                      {order.status.replaceAll("_", " ")}
                    </p>
                    <p className="font-mono text-sm">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountShell>
  );
}
