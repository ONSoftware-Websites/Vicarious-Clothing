import Link from "next/link";
import { Container } from "@/components/ui";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/site";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <Container className="flex h-9 items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] sm:text-[11px]">
        <p className="text-center">
          Free UK delivery over £{FREE_DELIVERY_THRESHOLD}
        </p>
        <Link
          href="/sell-to-us"
          className="hidden text-paper underline underline-offset-4 transition-colors hover:text-accent sm:inline-block"
        >
          Sell to us →
        </Link>
      </Container>
    </div>
  );
}
