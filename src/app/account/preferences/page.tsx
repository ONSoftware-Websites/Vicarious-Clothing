"use client";

import { useState } from "react";
import { AccountShell } from "@/components/account-shell";
import { useLocalStorage } from "@/hooks/use-local-storage";

const KEY = "vc_marketing_pref";

function parse(raw: string | null): boolean {
  return raw === "true";
}

export default function PreferencesPage() {
  const [marketing, setMarketing] = useLocalStorage<boolean>(
    KEY,
    false,
    parse,
    String
  );
  const [saved, setSaved] = useState(false);

  const save = (value: boolean) => {
    setMarketing(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AccountShell>
      <h2 className="mb-6 font-display text-lg font-semibold uppercase tracking-tight">
        Preferences
      </h2>
      <div className="max-w-md space-y-6">
        <div className="border border-line p-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
            Marketing emails
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            New drops, restocks and the occasional good story. Order updates
            are separate and will always reach you.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => save(true)}
              className={
                marketing
                  ? "flex h-11 flex-1 items-center justify-center border border-ink bg-ink font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-paper"
                  : "flex h-11 flex-1 items-center justify-center border border-line font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft hover:border-ink"
              }
            >
              On
            </button>
            <button
              type="button"
              onClick={() => save(false)}
              className={
                !marketing
                  ? "flex h-11 flex-1 items-center justify-center border border-ink bg-ink font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-paper"
                  : "flex h-11 flex-1 items-center justify-center border border-line font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft hover:border-ink"
              }
            >
              Off
            </button>
          </div>
          {saved && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
              Saved
            </p>
          )}
        </div>

        <div className="border border-line p-5">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
            Security
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Password and sign-in methods are part of the Phase 2 build. For
            now, this demo account lives in your browser.
          </p>
        </div>
      </div>
    </AccountShell>
  );
}
