import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = 40,
  alt = "Vicarious Clothing",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <Image
      src="/android-chrome-512x512.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
    />
  );
}
