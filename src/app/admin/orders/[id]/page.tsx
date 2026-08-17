import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/order-actions";
import { getOrder } from "@/lib/server/store";
import { conditionLabel, formatDateTime, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id}` };
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
          >
            ← All orders
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-tight">
            {order.id}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className="border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
          {order.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="border border-line">
            <h2 className="border-b border-line bg-cream px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Items
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.sku} className="flex items-center gap-4 px-5 py-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={80}
                    className="h-20 w-16 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      {item.brand}
                    </p>
                    <p className="font-display text-sm font-medium">{item.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {item.sku} · {item.size} · {conditionLabel(item.condition).toUpperCase()}
                    </p>
                  </div>
                  <p className="font-mono text-sm">{formatPrice(item.price)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount && (
                <div className="flex justify-between text-accent-deep">
                  <dt>{order.discount.code}</dt>
                  <dd>−{formatPrice(order.discount.amount || order.delivery)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>{order.delivery === 0 ? "Free" : formatPrice(order.delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm">
                <dt className="font-semibold uppercase tracking-[0.12em]">Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-line">
            <h2 className="border-b border-line bg-cream px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Actions
            </h2>
            <div className="p-5">
              <OrderActions id={order.id} status={order.status} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-line p-5">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Customer
            </h2>
            <p className="font-medium">{order.name}</p>
            <a
              href={`mailto:${order.email}`}
              className="font-mono text-xs text-accent-deep underline underline-offset-2"
            >
              {order.email}
            </a>
          </section>

          <section className="border border-line p-5">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Delivery address
            </h2>
            <p className="text-sm leading-relaxed">
              {order.address.line1}
              {order.address.line2 && (
                <>
                  <br />
                  {order.address.line2}
                </>
              )}
              <br />
              {order.address.city}, {order.address.postcode}
              <br />
              {order.address.country}
            </p>
          </section>

          <section className="border border-line p-5">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Shipment
            </h2>
            {order.tracking ? (
              <p className="font-mono text-xs">
                {order.carrier}
                <br />
                {order.tracking}
              </p>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                No tracking yet
              </p>
            )}
          </section>

          <section className="border border-line p-5">
            <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em]">
              Payment
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Channel: {order.channel}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Provider: {order.paymentProvider}
            </p>
            {order.paymentIntentId && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Payment intent: {order.paymentIntentId.slice(0, 14)}…
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
