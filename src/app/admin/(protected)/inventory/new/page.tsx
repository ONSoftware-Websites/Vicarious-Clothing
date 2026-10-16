import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  if (!(await requireRole("MANAGER"))) redirect("/admin");
  return <ProductForm />;
}
