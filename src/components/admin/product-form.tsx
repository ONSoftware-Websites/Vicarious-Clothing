"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Category, Condition, Product } from "@/lib/types";
import {
  CATEGORIES,
  CONDITIONS,
  MARKETPLACES,
} from "@/lib/types";
import { CATEGORY_LABELS, MEASUREMENT_FIELDS } from "@/lib/site";
import {
  CONDITION_LABELS,
  estimateFees,
  formatPrice,
  PACKAGING_COST,
} from "@/lib/utils";
import { ImageDropzone } from "@/components/admin/image-dropzone";

const input =
  "h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none";
const label =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft";

interface FormProduct {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  size: string;
  colour: string;
  material: string;
  condition: Condition;
  conditionNotes: string;
  measurements: Array<{ label: string; value: string }>;
  description: string;
  defects: string[];
  tags: string[];
  price: string;
  compareAtPrice: string;
  cost: string;
  floorPrice: string;
  images: Array<{ src: string; alt?: string }>;
  status: Product["status"];
  location: string;
  acquisitionSource: string;
  purchaseDate: string;
  prdCode: string;
  marketplace: Array<{ channel: string; status: "LISTED" | "NOT_LISTED" }>;
  isPick: boolean;
  featured: boolean;
}

function toForm(p?: Product): FormProduct {
  return {
    sku: p?.sku ?? "",
    slug: p?.slug ?? "",
    name: p?.name ?? "",
    brand: p?.brand ?? "",
    category: p?.category ?? "tops",
    size: p?.size ?? "",
    colour: p?.colour ?? "",
    material: p?.material ?? "",
    condition: p?.condition ?? "very_good",
    conditionNotes: p?.conditionNotes ?? "",
    measurements: p?.measurements ?? [],
    description: p?.description ?? "",
    defects: p?.defects ?? [],
    tags: p?.tags ?? [],
    price: p ? String(p.price) : "",
    compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : "",
    cost: p?.cost !== undefined ? String(p.cost) : "",
    floorPrice: p?.floorPrice !== undefined ? String(p.floorPrice) : "",
    images: p?.images ?? [],
    status: p?.status ?? "DRAFT",
    location: p?.location ?? "",
    acquisitionSource: p?.acquisitionSource ?? "",
    purchaseDate: p?.purchaseDate ?? "",
    prdCode: p?.prdCode ?? "",
    marketplace: p?.marketplace.length
      ? p.marketplace
      : MARKETPLACES.map((channel) => ({
          channel,
          status: channel === "website" ? "LISTED" : "NOT_LISTED",
        })),
    isPick: Boolean(p?.isPick),
    featured: Boolean(p?.featured),
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line p-6">
      <h2 className="mb-5 border-b border-line pb-3 font-display text-sm font-semibold uppercase tracking-[0.18em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState<FormProduct>(() => toForm(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormProduct>(key: K, value: FormProduct[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const measurementFields = useMemo(
    () => MEASUREMENT_FIELDS[form.category] ?? [],
    [form.category]
  );

  const setMeasurement = (label: string, value: string) => {
    const existing = form.measurements.find((m) => m.label === label);
    if (existing) {
      set(
        "measurements",
        form.measurements.map((m) => (m.label === label ? { ...m, value } : m))
      );
    } else if (value) {
      set("measurements", [...form.measurements, { label, value }]);
    }
  };

  const economics = useMemo(() => {
    const price = Number.parseFloat(form.price) || 0;
    const cost = Number.parseFloat(form.cost) || 0;
    const fees = estimateFees(price);
    const profit = price - cost - fees - PACKAGING_COST;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { price, cost, fees, profit, margin };
  }, [form.price, form.cost]);

  const save = async (publish: boolean) => {
    setSaving(true);
    setError("");
    try {
      const payload: Partial<Product> = {
        ...form,
        sku: form.sku || undefined,
        prdCode: form.prdCode.trim() || undefined,
        price: Number.parseFloat(form.price) || 0,
        compareAtPrice: form.compareAtPrice
          ? Number.parseFloat(form.compareAtPrice)
          : undefined,
        cost: form.cost ? Number.parseFloat(form.cost) : undefined,
        floorPrice: form.floorPrice
          ? Number.parseFloat(form.floorPrice)
          : undefined,
        status: publish ? "AVAILABLE" : "DRAFT",
        images: form.images.filter((i) => i.src.trim()),
        defects: form.defects.filter((d) => d.trim()),
        tags: form.tags.filter((t) => t.trim()),
        measurements: form.measurements.filter((m) => m.value.trim()),
        marketplace: form.marketplace as never,
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", product: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/inventory");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
            {product ? `Edit ${form.sku || "product"}` : "Add product"}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {product ? "Save changes to update the store" : "New SKU is assigned automatically"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="flex h-11 items-center justify-center border border-ink px-6 font-display text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="flex h-11 items-center justify-center bg-accent px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
          >
            {saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          save(true);
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      >
        <div className="space-y-6 xl:col-span-2">
          <Section title="Identity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pf-brand" className={label}>Brand</label>
                <input
                  id="pf-brand"
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  className={input}
                  placeholder="Carhartt"
                  required
                />
              </div>
              <div>
                <label htmlFor="pf-name" className={label}>Product name</label>
                <input
                  id="pf-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={input}
                  placeholder="Detroit Jacket"
                  required
                />
              </div>
              <div>
                <label htmlFor="pf-category" className={label}>Category</label>
                <select
                  id="pf-category"
                  value={form.category}
                  onChange={(e) => {
                    set("category", e.target.value as Category);
                    set("measurements", []);
                  }}
                  className={input}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pf-sku" className={label}>SKU (auto)</label>
                <input
                  id="pf-sku"
                  value={form.sku || "VC-XXXXXX (assigned on save)"}
                  readOnly
                  className={`${input} bg-cream text-ink-faint`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pf-prd" className={label}>SellerHQ PRD code</label>
                <input
                  id="pf-prd"
                  value={form.prdCode}
                  onChange={(e) => set("prdCode", e.target.value)}
                  className={input}
                  placeholder="PRD-000001"
                  autoCapitalize="characters"
                />
                <p className="mt-1 text-xs text-ink-faint">
                  Internal only. This appears in the admin inventory and is never shown to customers.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Product">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="pf-size" className={label}>Size</label>
                <input
                  id="pf-size"
                  value={form.size}
                  onChange={(e) => set("size", e.target.value)}
                  className={input}
                  placeholder="M / UK 9 / 32-32"
                  required
                />
              </div>
              <div>
                <label htmlFor="pf-colour" className={label}>Colour</label>
                <input
                  id="pf-colour"
                  value={form.colour}
                  onChange={(e) => set("colour", e.target.value)}
                  className={input}
                  placeholder="Carhartt Brown"
                />
              </div>
              <div>
                <label htmlFor="pf-material" className={label}>Material</label>
                <input
                  id="pf-material"
                  value={form.material}
                  onChange={(e) => set("material", e.target.value)}
                  className={input}
                  placeholder="12oz cotton duck"
                />
              </div>
              <div>
                <label htmlFor="pf-condition" className={label}>Condition</label>
                <select
                  id="pf-condition"
                  value={form.condition}
                  onChange={(e) => set("condition", e.target.value as Condition)}
                  className={input}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pf-condition-notes" className={label}>Condition notes</label>
                <input
                  id="pf-condition-notes"
                  value={form.conditionNotes}
                  onChange={(e) => set("conditionNotes", e.target.value)}
                  className={input}
                  placeholder="Light wear at cuffs. No holes or repairs."
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="pf-defects" className={label}>Defects (comma separated)</label>
                <input
                  id="pf-defects"
                  value={form.defects.join(", ")}
                  onChange={(e) =>
                    set(
                      "defects",
                      e.target.value
                        .split(",")
                        .map((d) => d.trim())
                        .filter(Boolean)
                    )
                  }
                  className={input}
                  placeholder="Small mark on front, pilling under arms"
                />
              </div>
            </div>
          </Section>

          <Section title="Measurements">
            {measurementFields.length === 0 ? (
              <p className="text-sm text-ink-faint">
                No measurements needed for this category.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {measurementFields.map((m) => (
                  <div key={m}>
                    <label htmlFor={`pf-m-${m}`} className={label}>
                      {m}
                    </label>
                    <input
                      id={`pf-m-${m}`}
                      value={
                        form.measurements.find((x) => x.label === m)?.value ?? ""
                      }
                      onChange={(e) => setMeasurement(m, e.target.value)}
                      className={input}
                      placeholder='23.5"'
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Acquisition">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="pf-source" className={label}>Source</label>
                <input
                  id="pf-source"
                  value={form.acquisitionSource}
                  onChange={(e) => set("acquisitionSource", e.target.value)}
                  className={input}
                  placeholder="Private seller"
                />
              </div>
              <div>
                <label htmlFor="pf-purchase-date" className={label}>Purchase date</label>
                <input
                  id="pf-purchase-date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="pf-cost" className={label}>Purchase cost (£)</label>
                <input
                  id="pf-cost"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => set("cost", e.target.value)}
                  className={input}
                  placeholder="18.00"
                />
              </div>
            </div>
          </Section>

          <Section title="Selling">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="pf-price" className={label}>List price (£)</label>
                <input
                  id="pf-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className={input}
                  placeholder="64.00"
                  required
                />
              </div>
              <div>
                <label htmlFor="pf-compare" className={label}>Sale — compare-at price (£)</label>
                <input
                  id="pf-compare"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", e.target.value)}
                  className={input}
                  placeholder="£80.00 → shows Sale badge + appears on /shop/sale"
                />
                {form.compareAtPrice && Number.parseFloat(form.compareAtPrice) > Number.parseFloat(form.price || "0") && (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep">
                    {Math.round((1 - Number.parseFloat(form.price || "0") / Number.parseFloat(form.compareAtPrice)) * 100)}% off — will appear on Sale
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="pf-floor" className={label}>Floor price (£)</label>
                <input
                  id="pf-floor"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.floorPrice}
                  onChange={(e) => set("floorPrice", e.target.value)}
                  className={input}
                  placeholder="48.00"
                />
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className={label}>Sales channels</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {MARKETPLACES.map((channel) => {
                  const entry = form.marketplace.find(
                    (m) => m.channel === channel
                  );
                  const listed = entry?.status === "LISTED";
                  return (
                    <label
                      key={channel}
                      className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={listed}
                        onChange={() =>
                          set(
                            "marketplace",
                            form.marketplace.map((m) =>
                              m.channel === channel
                                ? {
                                    ...m,
                                    status: listed ? "NOT_LISTED" : "LISTED",
                                  }
                                : m
                            )
                          )
                        }
                        className="h-4 w-4 accent-[#0097af]"
                      />
                      {channel}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPick}
                  onChange={(e) => set("isPick", e.target.checked)}
                  className="h-4 w-4 accent-[#0097af]"
                />
                Vicarious Pick
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 accent-[#0097af]"
                />
                Featured
              </label>
            </div>
          </Section>

          <Section title="Images">
            <ImageDropzone images={form.images} onChange={(images) => set("images", images)} bucket="product-images" max={10} />
            <p className="mt-3 text-xs text-ink-faint">Drag & drop or click — uploads to Supabase Storage (product-images bucket). First image is the cover. Reorder with ← →.</p>
          </Section>

          <Section title="Storage">
            <div className="max-w-xs">
              <label htmlFor="pf-location" className={label}>Rack / bin / location</label>
              <input
                id="pf-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={input}
                placeholder="A-04"
              />
            </div>
          </Section>

          <Section title="Description">
            <div className="space-y-4">
              <div>
                <label htmlFor="pf-description" className={label}>
                  Customer-facing copy
                </label>
                <textarea
                  id="pf-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="w-full border border-line bg-paper p-3 text-sm focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="pf-tags" className={label}>
                  Tags (comma separated)
                </label>
                <input
                  id="pf-tags"
                  value={form.tags.join(", ")}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    )
                  }
                  className={input}
                  placeholder="workwear, canvas, brown"
                />
              </div>
            </div>
          </Section>
        </div>

        <aside className="space-y-6">
          <div className="border border-ink bg-ink p-6 text-paper">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em]">
              Economics
            </h2>
            <dl className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <dt className="text-paper/60">Purchase cost</dt>
                <dd>{formatPrice(economics.cost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-paper/60">Sale price</dt>
                <dd>{formatPrice(economics.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-paper/60">Est. payment fee</dt>
                <dd>{formatPrice(economics.fees)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-paper/60">Packaging</dt>
                <dd>{formatPrice(PACKAGING_COST)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-paper/60">Other costs</dt>
                <dd>{formatPrice(0)}</dd>
              </div>
              <div className="flex justify-between border-t border-paper/20 pt-3">
                <dt className="font-semibold uppercase tracking-[0.12em]">
                  Est. profit
                </dt>
                <dd className={economics.profit >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {formatPrice(economics.profit)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-paper/60">Est. margin</dt>
                <dd>{economics.margin.toFixed(1)}%</dd>
              </div>
            </dl>
            <p className="mt-4 text-[10px] leading-relaxed text-paper/50">
              Fee estimate assumes 2.4% + 20p. Actual figures update when the
              payment provider is connected.
            </p>
          </div>

          <div className="border border-line p-6">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em]">
              Current status
            </h2>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-soft">
              {form.status}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              Save draft keeps this off the store. Publish makes it live
              immediately.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
