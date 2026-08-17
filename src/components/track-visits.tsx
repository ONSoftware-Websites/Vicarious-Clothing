"use client";

import { useEffect } from "react";

export function TrackVisits() {
  useEffect(() => {
    const key = "vc_tracked";
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
