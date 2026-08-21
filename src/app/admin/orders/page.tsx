import type { Metadata } from "next";
import Link from "next/link";
import { listOrders } from "@/lib/server/store";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Orders" };

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "border-amber-300 bg-amber-100 text-amber-900",
  PAID: "border-accent bg-accent-tint text-accent-deep",
  PICKING: "border-line bg-cream text-ink",
  READY_TO_DISPATCH: "border-amber-200 bg-amber-50 text-amber-800",
  DISPATCHED: "border-blue-200 bg-blue-50 text-blue-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  REFUNDED: "border-red-200 bg-red-50 text-red-800",
  RETURNED: "border-orange-200 bg-orange-50 text-orange-800",
  RETURN_REQUESTED: "border-orange-200 bg-orange-50 text-orange-800",
};

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Orders
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Order</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Customer</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Items</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Total</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-line hover:bg-cream/50">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-xs uppercase tracking-[0.12em] hover:text-accent-deep"
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{order.name}</p>
                  <p className="font-mono text-[10px] text-ink-faint">
                    {order.email} · {order.channel}
                    {order.paymentProvider === "stripe" ? " · stripe" : ""}
                  </p>
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {order.items.map((i) => i.name).join(", ")}
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatPrice(order.total)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_TONE[order.status] ?? "border-line text-ink-faint"}`}
                  >
                    {order.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
