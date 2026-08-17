import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InventoryActions } from "@/components/admin/inventory-actions";
import { listProducts } from "@/lib/server/store";
import { conditionLabel, formatPrice, STATUS_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.toLowerCase() : "";
  const status = typeof raw.status === "string" ? raw.status : "";

  const products = listProducts().filter((p) => {
    if (status && p.status !== status) return false;
    if (q && ![p.sku, p.name, p.brand, p.location ?? ""].join(" ").toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
            Inventory
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {products.length} {products.length === 1 ? "record" : "records"}
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="flex h-11 items-center justify-center bg-accent px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-accent-deep"
        >
          + Add product
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="inv-q">
          Search inventory
        </label>
        <input
          id="inv-q"
          name="q"
          defaultValue={raw.q && typeof raw.q === "string" ? raw.q : ""}
          placeholder="Search SKU, name, brand, location…"
          className="h-11 w-full max-w-sm border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
        />
        <label className="sr-only" htmlFor="inv-status">
          Filter by status
        </label>
        <select
          id="inv-status"
          name="status"
          defaultValue={status}
          className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase tracking-[0.12em] focus:border-ink focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="DRAFT">Draft</option>
          <option value="SOLD">Sold</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="h-11 border border-ink px-5 font-display text-xs font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-paper"
        >
          Apply
        </button>
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">SKU</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Product</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Cost</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Price</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Location</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={p.images[0]?.src ?? ""}
                      alt=""
                      width={40}
                      height={50}
                      className="h-[50px] w-10 object-cover"
                    />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        {p.brand}
                      </p>
                      <Link
                        href={`/product/${p.slug}`}
                        className="font-display text-sm font-medium hover:text-accent-deep"
                      >
                        {p.name}
                      </Link>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                        {p.size} · {conditionLabel(p.condition).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs">
                  {p.cost !== undefined ? formatPrice(p.cost) : "—"}
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatPrice(p.price)}</td>
                <td className="px-4 py-4">
                  <span
                    className={
                      p.status === "AVAILABLE"
                        ? "border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        : p.status === "SOLD"
                          ? "border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper"
                          : p.status === "RESERVED"
                            ? "border border-accent bg-accent-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep"
                            : "border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint"
                    }
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-xs">{p.location ?? "—"}</td>
                <td className="px-4 py-4">
                  <InventoryActions sku={p.sku} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  Nothing matches
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
