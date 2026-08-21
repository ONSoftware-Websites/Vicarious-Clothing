import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Admin | Vicarious Clothing",
    template: "%s | Vicarious Admin",
  },
  robots: { index: false, follow: false },
};

// This is a pass-through layout so /admin/login does NOT inherit the
// protected gate. The actual auth check lives in (protected)/layout.tsx
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
