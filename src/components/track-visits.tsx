"use client";

import { useEffect } from "react";
import { CONSENT_KEY, COOKIE_CONSENT_EVENT } from "@/components/cookie-banner";

export function TrackVisits() {
  useEffect(() => {
    const track = () => {
      if (window.localStorage.getItem(CONSENT_KEY) !== "all") return;
      const key = "vc_tracked";
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
      fetch("/api/track", { method: "POST" }).catch(() => {});
    };

    track();
    window.addEventListener(COOKIE_CONSENT_EVENT, track);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, track);
  }, []);

  return null;
}
