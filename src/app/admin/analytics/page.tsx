import type { Metadata } from "next";
import { listOrders, listProducts, getVisits, productEconomics } from "@/lib/server/store";
import { formatPrice } from "@/lib/utils";
import { CHANNELS, type SalesChannel } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Analytics" };

function Metric({
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

export default function AnalyticsPage() {
  const orders = listOrders();
  const products = listProducts();
  const visits = getVisits();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = orders.filter(
    (o) => !["CANCELLED", "REFUNDED", "PENDING_PAYMENT"].includes(o.status)
  );
  const monthOrders = completed.filter(
    (o) => new Date(o.createdAt) >= monthStart
  );

  const revenue = completed.reduce((s, o) => s + o.total, 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

  const soldSkus = new Set<string>();
  for (const o of completed) for (const i of o.items) soldSkus.add(i.sku);

  let netProfit = 0;
  for (const sku of soldSkus) {
    const product = products.find((p) => p.sku === sku);
    if (product) netProfit += productEconomics(product).profit;
  }

  const itemsSold = soldSkus.size;
  const avgOrder = orders.length ? revenue / completed.length : 0;
  const websiteOrders = completed.filter((o) => o.channel === "website").length;
  const conversion = visits.total > 0 ? (websiteOrders / visits.total) * 100 : 0;
  const returned = completed.filter((o) =>
    ["RETURNED", "REFUNDED", "RETURN_REQUESTED"].includes(o.status)
  ).length;
  const returnRate = completed.length ? (returned / completed.length) * 100 : 0;

  const soldProducts = products.filter((p) => p.status === "SOLD" && p.soldAt);
  const avgDaysToSell = soldProducts.length
    ? soldProducts.reduce(
        (sum, p) =>
          sum +
          (new Date(p.soldAt!).getTime() - new Date(p.listedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        0
      ) / soldProducts.length
    : 0;

  const channelTotals = CHANNELS.map((channel: SalesChannel) => {
    const channelOrders = completed.filter((o) => o.channel === channel);
    return {
      channel,
      orders: channelOrders.length,
      revenue: channelOrders.reduce((s, o) => s + o.total, 0),
    };
  });
  const websiteRevenue = channelTotals.find((c) => c.channel === "website")?.revenue ?? 0;
  const marketplaceRevenue = revenue - websiteRevenue;

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (29 - i));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      label: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: completed
        .filter((o) => o.createdAt.slice(0, 10) === key)
        .reduce((s, o) => s + o.total, 0),
      visits: visits.byDay[key] ?? 0,
    };
  });
  const maxRevenue = Math.max(1, ...last30Days.map((d) => d.revenue));

  const brandRevenue = new Map<string, number>();
  for (const o of completed) {
    for (const i of o.items) {
      brandRevenue.set(i.brand, (brandRevenue.get(i.brand) ?? 0) + i.price);
    }
  }
  const topBrands = [...brandRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Analytics
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} ·
          completed orders only
        </p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          This month
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Revenue" value={formatPrice(monthRevenue)} />
          <Metric label="Orders" value={String(monthOrders.length)} />
          <Metric label="Visits" value={String(visits.byDay[now.toISOString().slice(0, 10)] ?? 0)} sub={`${visits.total} all time`} />
          <Metric
            label="Website vs marketplace"
            value={`${websiteRevenue > 0 ? Math.round((websiteRevenue / (revenue || 1)) * 100) : 0}%`}
            sub={`website £${websiteRevenue.toFixed(0)} / marketplace £${marketplaceRevenue.toFixed(0)}`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          All time
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Revenue" value={formatPrice(revenue)} />
          <Metric label="Net profit" value={formatPrice(netProfit)} sub="after cost, fees, packaging" />
          <Metric label="Items sold" value={String(itemsSold)} />
          <Metric label="Average order" value={formatPrice(avgOrder)} />
          <Metric label="Website conversion" value={`${conversion.toFixed(2)}%`} sub="website orders ÷ visits" />
          <Metric label="Return rate" value={`${returnRate.toFixed(1)}%`} sub={`${returned} orders returned/refunded`} />
          <Metric label="Average days to sell" value={`${avgDaysToSell.toFixed(0)} days`} />
          <Metric label="Orders" value={String(completed.length)} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Sales by channel
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {channelTotals.map((c) => (
            <div key={c.channel} className="border border-line p-5">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
                {c.channel}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {formatPrice(c.revenue)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                {c.orders} {c.orders === 1 ? "order" : "orders"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Growing the website share without losing total profitability is the
          strategic metric — track this month by month.
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Last 30 days
        </h2>
        <div className="flex h-40 items-end gap-1 overflow-x-auto border border-line bg-cream p-4">
          {last30Days.map((d) => (
            <div
              key={d.key}
              className="group flex min-w-3 flex-1 flex-col justify-end"
              title={`${d.label} — ${formatPrice(d.revenue)} · ${d.visits} visits`}
            >
              <div
                className="bg-accent transition-opacity group-hover:opacity-70"
                style={{
                  height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Revenue per day (hover for detail)
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Top brands by revenue
        </h2>
        <ul className="divide-y divide-line border border-line">
          {topBrands.map(([brand, total], i) => (
            <li key={brand} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm">
                <span className="mr-3 font-mono text-xs text-ink-faint">0{i + 1}</span>
                {brand}
              </p>
              <p className="font-mono text-xs">{formatPrice(total)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
