import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type WatermarkSize = "sm" | "md" | "lg";

const markSize: Record<WatermarkSize, string> = {
  sm: "h-7 w-7 sm:h-8 sm:w-8",
  md: "h-9 w-9 sm:h-11 sm:w-11",
  lg: "h-11 w-11 sm:h-14 sm:w-14",
};

const shellSize: Record<WatermarkSize, string> = {
  sm: "bottom-1.5 right-1.5 p-0.5 sm:bottom-2 sm:right-2",
  md: "bottom-2 right-2 p-0.5 sm:bottom-3 sm:right-3",
  lg: "bottom-3 right-3 p-1 sm:bottom-5 sm:right-5",
};

export function ProductImageWatermark({
  size = "md",
  className,
}: {
  size?: WatermarkSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20 inline-flex rounded-full bg-paper/85 shadow-lg ring-1 ring-paper/80 backdrop-blur-[1px]",
        shellSize[size],
        className
      )}
    >
      <BrandMark
        alt=""
        size={64}
        className={cn("rounded-full opacity-90", markSize[size])}
      />
    </span>
  );
}
