"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account-shell";
import { useAccount } from "@/hooks/use-account";
import { useLocalStorage } from "@/hooks/use-local-storage";

const KEY = "vc_marketing_pref";

function parse(raw: string | null): boolean {
  return raw === "true";
}

export default function PreferencesPage() {
  const { user } = useAccount();
  const [localMarketing, setLocalMarketing] = useLocalStorage<boolean>(KEY, false, parse, String);
  const [remoteMarketing, setRemoteMarketing] = useState<boolean | null>(null);
  const marketing = remoteMarketing !== null ? remoteMarketing : localMarketing;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { setRemoteMarketing(null); return; }
    fetch("/api/account/preferences").then(r => r.json()).then(d => setRemoteMarketing(Boolean(d.marketing))).catch(() => setRemoteMarketing(false));
  }, [user?.id]);

  const save = async (value: boolean) => {
    if (user) {
      const res = await fetch("/api/account/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketing: value }) });
      if (res.ok) setRemoteMarketing(value);
    } else {
      setLocalMarketing(value);
    }
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
            Signed in with email and password. Use <a href="/auth/reset" className="text-accent-deep underline underline-offset-2">reset password</a> to change your password.
          </p>
        </div>
      </div>
    </AccountShell>
  );
}
