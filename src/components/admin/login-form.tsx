"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data.error as string) || "Wrong password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          Staff only
        </p>
        <h1 className="mb-8 font-display text-3xl font-semibold uppercase tracking-tight">
          Admin login
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            className="flex h-13 w-full items-center justify-center bg-ink font-display text-xs font-semibold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          2FA for privileged roles is on the Phase 2 roadmap
        </p>
      </div>
    </div>
  );
}
