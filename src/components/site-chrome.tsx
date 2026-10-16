"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchOverlay } from "@/components/search-overlay";
import { BagDrawer } from "@/components/bag-drawer";
import { CookieBanner } from "@/components/cookie-banner";
import { TrackVisits } from "@/components/track-visits";

// Admin pages own their navigation and layout. Storefront chrome must not
// render there, including the announcement bar and floating overlays.
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (admin) return <>{children}</>;

  return <>
    <AnnouncementBar />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <SearchOverlay />
    <BagDrawer />
    <CookieBanner />
    <TrackVisits />
  </>;
}
