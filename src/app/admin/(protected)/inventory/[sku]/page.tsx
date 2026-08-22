import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InventoryDeleteButton } from "@/components/admin/inventory-delete-button";
import { ProductForm } from "@/components/admin/product-form";
import { getProductBySku, listAuditLog } from "@/lib/server/store";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  return { title: `Edit ${sku}` };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) notFound();

  const history = (await listAuditLog(500)).filter(
    (entry) => entry.detail?.toUpperCase().includes(sku.toUpperCase())
  );

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <InventoryDeleteButton sku={sku} />
      </div>
      <ProductForm product={product} />

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em]">
          Item history
        </h2>
        {history.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            No recorded changes yet.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {history.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <p className="text-sm">
                  <span className="font-semibold">{entry.actor}</span>{" "}
                  {entry.action}
                </p>
                {(entry.before || entry.after) && (
                  <p className="mt-0.5 font-mono text-xs text-ink-soft">
                    {entry.before && `${entry.before}`}
                    {entry.before && entry.after && " → "}
                    {entry.after && `${entry.after}`}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  {formatDateTime(entry.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
