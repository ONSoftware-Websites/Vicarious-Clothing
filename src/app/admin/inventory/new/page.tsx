import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add Product" };

export default function NewProductPage() {
  return <ProductForm />;
}
