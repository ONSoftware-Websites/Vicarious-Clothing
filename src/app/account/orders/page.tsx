"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account-shell";
import { useAccount } from "@/hooks/use-account";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { profile, loading: accountLoading } = useAccount();
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
      <h2 className="mb-6 font-display text-lg font-semibold uppercase tracking-tight">
        Orders
      </h2>
      {loading ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          Loading…
        </p>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-line p-10 text-center">
          <p className="font-display text-sm font-semibold uppercase">
            No orders yet
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block border border-ink px-6 py-3 font-display text-xs font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-paper"
          >
            Find something
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {orders.map((order) => (
            <li key={order.id} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/order/${order.id}`}
                    className="font-mono text-sm uppercase tracking-[0.14em] hover:text-accent-deep"
                  >
                    {order.id}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {order.items.map((i) => i.name).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    {order.status.replaceAll("_", " ")}
                  </p>
                  <p className="font-mono text-sm">{formatPrice(order.total)}</p>
                </div>
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Placed {formatDate(order.createdAt)}
                {order.tracking && ` · ${order.carrier}: ${order.tracking}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
