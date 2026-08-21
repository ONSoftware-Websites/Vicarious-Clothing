import Link from "next/link";
import { listAuditLog, listLeads, listOrders, listProducts } from "@/lib/server/store";
import { formatPrice, isAgedDays } from "@/lib/utils";
import { FormatDateTime, Now } from "@/components/time";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-line bg-cream p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {sub && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          {sub}
        </p>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const products = await listProducts();
  const orders = await listOrders();
  const leads = await listLeads();
  const auditLog = await listAuditLog(12);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday = orders.filter(
    (o) => new Date(o.createdAt) >= today
  );
  const revenueToday = ordersToday.reduce((s, o) => s + o.total, 0);
  const awaitingDispatch = orders.filter(
    (o) => o.status === "READY_TO_DISPATCH"
  ).length;
  const newEnquiries = leads.filter((l) => l.status === "NEW").length;

  const available = products.filter((p) => p.status === "AVAILABLE").length;
  const preparing = products.filter((p) => p.status === "DRAFT").length;
  const aged = products.filter(
    (p) => p.status === "AVAILABLE" && isAgedDays(p.listedAt, 60)
  ).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          <Now />
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Today
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Orders" value={String(ordersToday.length)} />
          <Stat label="Revenue" value={formatPrice(revenueToday)} />
          <Stat label="Awaiting dispatch" value={String(awaitingDispatch)} />
          <Stat label="New enquiries" value={String(newEnquiries)} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Inventory
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Available" value={String(available)} />
          <Stat label="Preparing" value={String(preparing)} />
          <Stat label="Aged 60+ days" value={String(aged)} />
          <Stat label="Sold (all time)" value={String(products.filter((p) => p.status === "SOLD").length)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep underline underline-offset-2"
            >
              All orders →
            </Link>
          </div>
          <ul className="divide-y divide-line border border-line">
            {orders.slice(0, 6).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-cream"
                >
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em]">
                      {order.id}
                    </p>
                    <p className="text-sm text-ink-soft">{order.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      {order.status.replaceAll("_", " ")}
                    </p>
                    <p className="font-mono text-xs">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Audit log
          </h2>
          <ul className="divide-y divide-line border border-line">
            {auditLog.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <p className="text-sm">
                  <span className="font-semibold">{entry.actor}</span>{" "}
                  {entry.action} <span className="font-mono text-xs">{entry.detail}</span>
                </p>
                {(entry.before || entry.after) && (
                  <p className="mt-0.5 font-mono text-xs text-ink-soft">
                    {entry.before && `${entry.before}`}
                    {entry.before && entry.after && " → "}
                    {entry.after && `${entry.after}`}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <FormatDateTime date={entry.at} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
