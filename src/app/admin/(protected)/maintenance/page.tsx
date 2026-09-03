import type { Metadata } from "next";
import { ImageMigrationPanel } from "@/components/admin/image-migration-panel";

export const metadata: Metadata = {
  title: "Maintenance | Vicarious Admin",
};

export default function MaintenancePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Admin</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">Maintenance</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Controlled one-off operational tasks. These tools are protected by the existing admin session and are not part of normal storefront traffic.
        </p>
      </div>

      <ImageMigrationPanel />
    </div>
  );
}
