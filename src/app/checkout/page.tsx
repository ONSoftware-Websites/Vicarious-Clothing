"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Container } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import { useMounted } from "@/hooks/use-local-storage";
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_COST, EXPRESS_DELIVERY_COST } from "@/lib/site";
import { conditionLabel, formatPrice } from "@/lib/utils";

interface CheckoutProduct {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  price: number;
  status: string;
  images: Array<{ src: string; alt?: string }>;
}

type Step = "contact" | "delivery" | "payment" | "review";

const input =
  "h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const mounted = useMounted();
  const [products, setProducts] = useState<Record<string, CheckoutProduct>>({});
  const [step, setStep] = useState<Step>("contact");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const country = "United Kingdom";
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [terms, setTerms] = useState(false);
  const [card, setCard] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.location.search.includes("cancelled=1")) setCancelled(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const skus = useMemo(() => lines.map((l) => l.sku), [lines]);

  useEffect(() => {
    if (!mounted) return;
    if (lines.length === 0) {
      router.replace("/bag");
      return;
    }
    let cancelled = false;
    fetch(`/api/products?skus=${encodeURIComponent(lines.map((l) => l.sku).join(","))}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, CheckoutProduct> = {};
        for (const p of data.products) map[p.sku] = p;
        setProducts(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lines, mounted, router]);

  useEffect(() => {
    if (skus.length === 0) return;
    let cancelled = false;
    fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.gone?.length) {
          setError("SOMEONE GOT THERE FIRST. A piece in your bag has just sold.");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      fetch("/api/release", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus }),
      }).catch(() => {});
    };
  }, [skus]);

  const items = lines
    .map((line) => ({ line, product: products[line.sku] }))
    .filter((x) => x.product);

  const subtotal = items.reduce(
    (sum, { line, product }) => sum + product.price * line.qty,
    0
  );
  const baseDeliveryCost =
    subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : delivery === "express"
        ? EXPRESS_DELIVERY_COST
        : STANDARD_DELIVERY_COST;

  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{
    code: string;
    description: string;
    amount: number;
    type: string;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);

  const applyCode = async () => {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    setDiscountError("");
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode.trim(),
          subtotal,
          email,
          skus: items.map(({ line }) => line.sku),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDiscount(null);
        setDiscountError(data.error ?? "That code doesn't work.");
      } else {
        setDiscount(data.discount);
        setDiscountError("");
      }
    } catch {
      setDiscountError("Couldn't check that code. Try again.");
    } finally {
      setCheckingCode(false);
    }
  };

  const discountAmount = discount?.amount ?? 0;
  const deliveryCost =
    discount?.type === "free_delivery" ? 0 : baseDeliveryCost;
  const total = Math.max(0, subtotal - discountAmount) + deliveryCost;

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          items: items.map(({ line }) => ({ sku: line.sku })),
          deliveryCost,
          address: { line1, line2, city, postcode, country },
          discountCode: discount?.code,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError("SOMEONE GOT THERE FIRST. A piece in your bag has just sold.");
        setProducts((prev) => {
          const next = { ...prev };
          for (const sku of data.gone ?? []) {
            if (next[sku]) next[sku] = { ...next[sku], status: "SOLD" };
          }
          return next;
        });
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong placing your order. Please try again.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      clear();
      router.push(`/order/${data.order.id}`);
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const steps: Step[] = ["contact", "delivery", "payment", "review"];
  const stepIndex = steps.indexOf(step);

  const canContinue =
    (step === "contact" && email.includes("@")) ||
    (step === "delivery" && name && line1 && city && postcode) ||
    (step === "payment" && card.length >= 12 && cardName && cardExpiry && cardCvc && terms) ||
    step === "review";

  const submitStep = (e: FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    if (step === "review") {
      placeOrder();
      return;
    }
    setStep(steps[stepIndex + 1]);
    window.scrollTo(0, 0);
  };

  const loading =
    !mounted || (lines.length > 0 && lines.some((l) => !products[l.sku]));

  if (loading) {
    return (
      <Container className="py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          Loading…
        </p>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="mb-8 border-b border-line pb-6 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
        Checkout
      </h1>

      <ol className="mb-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em]">
        {steps.map((s, i) => (
          <li
            key={s}
            className={
              i === stepIndex
                ? "flex items-center gap-2 text-accent-deep"
                : i < stepIndex
                  ? "flex items-center gap-2 text-ink"
                  : "flex items-center gap-2 text-ink-faint"
            }
          >
            <span>0{i + 1}</span> {s}
            {i < steps.length - 1 && <span className="ml-8 text-ink-faint" aria-hidden>→</span>}
          </li>
        ))}
      </ol>

      {cancelled && (
        <div className="mb-8 border border-line bg-cream p-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
            Payment not completed
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            You can pick up where you left off — your pieces are still reserved
            for a short while.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-8 border border-red-200 bg-red-50 p-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-red-800">
            {error}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Remove the sold piece from your bag and continue.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <form onSubmit={submitStep} className="lg:col-span-2" noValidate>
          {step === "contact" && (
            <section aria-label="Contact">
              <h2 className="mb-5 font-display text-lg font-semibold uppercase tracking-tight">
                Contact
              </h2>
              <div>
                <label htmlFor="co-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                  Email
                </label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0097af]"
                />
                <span>
                  Email me about new drops. Optional — order updates will be
                  sent to this address regardless.
                </span>
              </label>
            </section>
          )}

          {step === "delivery" && (
            <section aria-label="Delivery">
              <h2 className="mb-5 font-display text-lg font-semibold uppercase tracking-tight">
                Delivery
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="co-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Full name
                  </label>
                  <input
                    id="co-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={input}
                    autoComplete="name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-line1" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Address line 1
                  </label>
                  <input
                    id="co-line1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className={input}
                    autoComplete="address-line1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-line2" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Address line 2 (optional)
                  </label>
                  <input
                    id="co-line2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className={input}
                    autoComplete="address-line2"
                  />
                </div>
                <div>
                  <label htmlFor="co-city" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    City
                  </label>
                  <input
                    id="co-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={input}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label htmlFor="co-postcode" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Postcode
                  </label>
                  <input
                    id="co-postcode"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className={input}
                    autoComplete="postal-code"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-country" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Country
                  </label>
                  <input
                    id="co-country"
                    value={country}
                    readOnly
                    className={`${input} bg-cream text-ink-faint`}
                  />
                </div>
              </div>

              <fieldset className="mt-8">
                <legend className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.18em]">
                  Delivery method
                </legend>
                <div className="space-y-3">
                  {[
                    {
                      key: "standard" as const,
                      title: "Standard — Royal Mail Tracked 48",
                      price: subtotal >= FREE_DELIVERY_THRESHOLD ? "Free" : formatPrice(STANDARD_DELIVERY_COST),
                      note: "2–3 working days",
                    },
                    {
                      key: "express" as const,
                      title: "Express — Royal Mail Tracked 24",
                      price: formatPrice(EXPRESS_DELIVERY_COST),
                      note: "Next working day when ordered before 2pm",
                    },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className={
                        delivery === option.key
                          ? "flex cursor-pointer items-center justify-between border border-ink bg-cream p-4"
                          : "flex cursor-pointer items-center justify-between border border-line p-4 hover:border-ink-faint"
                      }
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={delivery === option.key}
                          onChange={() => setDelivery(option.key)}
                          className="h-4 w-4 accent-[#0097af]"
                        />
                        <span>
                          <span className="block font-display text-sm font-medium">
                            {option.title}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                            {option.note}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono text-sm">{option.price}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {step === "payment" && (
            <section aria-label="Payment">
              <h2 className="mb-2 font-display text-lg font-semibold uppercase tracking-tight">
                Payment
              </h2>
              <p className="mb-6 text-xs leading-relaxed text-ink-faint">
                Payments are processed by an established payment provider.
                Vicarious never stores your card details. This checkout is in
                test mode — no payment will be taken.
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="co-card" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Card number
                  </label>
                  <input
                    id="co-card"
                    inputMode="numeric"
                    required
                    value={card}
                    onChange={(e) => setCard(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className={input}
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="co-card-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Name on card
                  </label>
                  <input
                    id="co-card-name"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label htmlFor="co-expiry" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    Expiry
                  </label>
                  <input
                    id="co-expiry"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className={input}
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label htmlFor="co-cvc" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                    CVC
                  </label>
                  <input
                    id="co-cvc"
                    inputMode="numeric"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={input}
                    placeholder="123"
                  />
                </div>
              </div>
              <label className="mt-8 flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0097af]"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/terms" className="text-accent-deep underline underline-offset-2">
                    terms and conditions
                  </Link>{" "}
                  and have read the{" "}
                  <Link href="/legal/privacy" className="text-accent-deep underline underline-offset-2">
                    privacy policy
                  </Link>
                  .
                </span>
              </label>
            </section>
          )}

          {step === "review" && (
            <section aria-label="Review">
              <h2 className="mb-5 font-display text-lg font-semibold uppercase tracking-tight">
                Review your order
              </h2>
              <div className="space-y-6">
                <div className="border border-line p-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    Contact
                  </p>
                  <p className="text-sm">{email}</p>
                  {marketing && (
                    <p className="mt-1 text-xs text-ink-faint">Opted in to new drop emails</p>
                  )}
                </div>
                <div className="border border-line p-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    Delivery address
                  </p>
                  <p className="text-sm leading-relaxed">
                    {name}
                    <br />
                    {line1}
                    {line2 && (
                      <>
                        <br />
                        {line2}
                      </>
                    )}
                    <br />
                    {city}, {postcode}
                    <br />
                    {country}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                    {delivery === "express" ? "Express — Tracked 24" : "Standard — Tracked 48"}
                  </p>
                </div>
                <div className="border border-line p-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    Payment
                  </p>
                  <p className="text-sm">
                    Card ending {card.slice(-4)} · {cardName}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">Test mode — no payment taken</p>
                </div>
              </div>
            </section>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setStep(steps[stepIndex - 1])}
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft underline underline-offset-4 hover:text-accent-deep"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={!canContinue || placing}
              className="flex h-14 items-center justify-center bg-ink px-12 font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-ink-faint"
            >
              {placing
                ? "Placing order…"
                : step === "review"
                  ? `Pay ${formatPrice(total)}`
                  : "Continue →"}
            </button>
          </div>
        </form>

        <aside className="lg:col-span-1">
          <div className="border border-line bg-cream p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em]">
              Your bag
            </h2>
            <ul className="divide-y divide-line">
              {items.map(({ line, product }) => (
                <li key={line.sku} className="flex items-center gap-3 py-3">
                  <Image
                    src={product.images[0]?.src ?? ""}
                    alt={product.name}
                    width={48}
                    height={60}
                    className="h-[60px] w-12 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                      {product.brand}
                    </p>
                    <p className="font-display text-xs font-medium">
                      {product.name}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
                      {conditionLabel(product.condition as never).toUpperCase()} · ×
                      {line.qty}
                    </p>
                  </div>
                  <p className="font-mono text-xs">
                    {formatPrice(product.price * line.qty)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="discount-code">
                  Discount code
                </label>
                <input
                  id="discount-code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="DISCOUNT CODE"
                  className="h-10 w-full border border-line bg-paper px-3 font-mono text-[10px] uppercase tracking-[0.14em] focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  disabled={checkingCode || !discountCode.trim()}
                  onClick={applyCode}
                  className="h-10 shrink-0 border border-ink px-4 font-display text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {discountError && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">
                  {discountError}
                </p>
              )}
              {discount && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep">
                  {discount.code} applied — {discount.description}
                </p>
              )}
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {discount && (
                <div className="flex justify-between text-accent-deep">
                  <dt>{discount.code}</dt>
                  <dd>
                    −
                    {discount.type === "free_delivery"
                      ? formatPrice(deliveryCost === 0 ? 0 : baseDeliveryCost)
                      : formatPrice(discount.amount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd>{deliveryCost === 0 ? "Free" : formatPrice(deliveryCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm">
                <dt className="font-semibold uppercase tracking-[0.12em]">Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] leading-relaxed text-ink-faint">
              Items are reserved while you check out. Unique pieces hold for a
              limited time.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
