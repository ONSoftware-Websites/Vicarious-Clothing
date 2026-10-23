"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_KEY, COOKIE_CONSENT_EVENT } from "@/components/cookie-banner";

function identifier(key: string) {
  const existing = window.localStorage.getItem(key);
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
  const value = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replaceAll("-", "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  window.localStorage.setItem(key, value);
  return value;
}

export function TrackVisits() {
  const pathname = usePathname();

  useEffect(() => {
    const track = () => {
      if (window.localStorage.getItem(CONSENT_KEY) !== "all") return;
      const sessionKey = "vc_analytics_session";
      const previousSession = window.sessionStorage.getItem(sessionKey);
      const sessionId = previousSession || identifier("vc_analytics_session_fallback");
      if (!previousSession) window.sessionStorage.setItem(sessionKey, sessionId);
      const visitorId = identifier("vc_analytics_visitor");
      const newSession = !previousSession;
      window.sessionStorage.setItem("vc_analytics_session", sessionId);
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname, visitorId, sessionId,
          referrerHost: document.referrer || null, newSession,
        }),
        keepalive: true,
      }).catch(() => {});
    };
    track();
    window.addEventListener(COOKIE_CONSENT_EVENT, track);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, track);
  }, [pathname]);

  return null;
}
