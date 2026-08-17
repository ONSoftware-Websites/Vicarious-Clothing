import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Button } from "@/components/ui";
import { getOrder } from "@/lib/server/store";
import { conditionLabel, formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id}`, robots: { index: false } };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  const raw = await searchParams;
  const justPaid = raw.paid === "1";
  const pending = order.status === "PENDING_PAYMENT";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        {pending ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber-700">
              Order {order.id}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold uppercase tracking-tight sm:text-6xl">
              Nearly yours.
            </h1>
            <p className="mt-4 text-ink-soft">
              Payment hasn&apos;t gone through yet. Your pieces are reserved for
              a short while.
            </p>
            {order.checkoutUrl && (
              <a
                href={order.checkoutUrl}
                className="mt-8 inline-flex h-14 items-center justify-center bg-ink px-9 font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent"
              >
                Complete payment →
              </a>
            )}
          </>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent-deep">
              Order {order.id}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold uppercase tracking-tight sm:text-6xl">
              It&apos;s yours.
            </h1>
            <p className="mt-4 text-ink-soft">
              We&apos;ll let you know when it&apos;s on the way.
            </p>
            {justPaid && (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-700">
                Payment confirmed — thanks for shopping with us.
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/account/orders">View order</Button>
              <Button href="/shop" variant="outline">
                Keep browsing
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="mx-auto mt-14 max-w-2xl border border-line">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-cream px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Order {order.id}
            </p>
            <p className="text-sm">{formatDate(order.createdAt)}</p>
          </div>
          <span className="border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]">
            {order.status.replaceAll("_", " ")}
          </span>
        </div>

        <ul className="divide-y divide-line px-6">
          {order.items.map((item) => (
            <li key={item.sku} className="flex items-center gap-4 py-4">
              <Image
                src={item.image}
                alt={item.name}
                width={64}
                height={80}
                className="h-20 w-16 object-cover"
              />
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  {item.brand}
                </p>
                <p className="font-display text-sm font-medium">{item.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  {item.sku} · Size {item.size} ·{" "}
                  {conditionLabel(item.condition).toUpperCase()}
                </p>
              </div>
              <p className="font-mono text-sm">{formatPrice(item.price)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-line px-6 py-5 font-mono text-xs">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount && (
            <div className="flex justify-between text-accent-deep">
              <dt>{order.discount.code} — {order.discount.description}</dt>
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

        <div className="border-t border-line px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Delivery address
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {order.name}
            <br />
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
          {order.tracking && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em]">
              {order.carrier} · Tracking: {order.tracking}
            </p>
          )}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Questions?{" "}
        <Link href="/help/contact" className="text-accent-deep underline underline-offset-2">
          Contact us
        </Link>{" "}
        — we answer within one working day.
      </p>
    </Container>
  );
}
