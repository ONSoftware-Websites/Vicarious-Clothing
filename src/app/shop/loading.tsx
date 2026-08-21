import { Container } from "@/components/ui";
import { ProductGridSkeleton } from "@/components/product-grid";

export default function Loading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-3">
          <div className="h-8 w-24 animate-pulse bg-cream" />
          <div className="h-3 w-20 animate-pulse bg-cream" />
        </div>
        <div className="hidden h-10 w-28 animate-pulse bg-cream sm:block" />
      </div>
      <div className="flex gap-10">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-4">
            <div className="h-4 w-16 animate-pulse bg-cream" />
            <div className="h-20 animate-pulse bg-cream" />
            <div className="h-20 animate-pulse bg-cream" />
          </div>
        </div>
        <div className="flex-1">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </Container>
  );
}
