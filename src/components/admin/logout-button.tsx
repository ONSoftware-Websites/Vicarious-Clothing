"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/60 hover:text-paper"
    >
      Log out
    </button>
  );
}
