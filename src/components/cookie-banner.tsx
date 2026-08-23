"use client";

import { useEffect, useState } from "react";

export const CONSENT_KEY = "vc_cookie_consent";
export const COOKIE_CONSENT_EVENT = "vc_cookie_consent_changed";

function saveConsent(value: "all" | "optional-out") {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!window.localStorage.getItem(CONSENT_KEY)) setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const choose = (value: "all" | "optional-out") => {
    saveConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 border border-line bg-ink text-paper shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md">
      <div className="p-6">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
          We use cookies
        </p>
        <p className="mt-2 text-sm leading-relaxed text-paper/80">
          We use necessary technologies to make the store work. With permission,
          we also use basic site analytics.
        </p>

        {managing && (
          <div className="mt-4 border border-paper/20 p-4 text-sm text-paper/80">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-paper">
              Your choices
            </p>
            <p className="mt-2">
              Necessary cookies keep your bag, wishlist and consent choice working.
              Optional analytics record a basic visit count only after you accept.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => choose("all")}
            className="h-11 bg-paper font-display text-[11px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-cream"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => choose("optional-out")}
            className="h-11 border border-paper/30 font-display text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-paper"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() => setManaging((value) => !value)}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 underline underline-offset-4 hover:text-paper"
          >
            {managing ? "Hide choices" : "Manage choices"}
          </button>
        </div>
      </div>
    </div>
  );
}
