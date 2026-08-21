"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export interface AccountProfile {
  name: string;
  email: string;
}

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const profile: AccountProfile | null = user
    ? {
        name: (user.user_metadata?.name as string) || user.email?.split("@")[0] || "User",
        email: user.email || "",
      }
    : null;

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // Legacy demo signIn (no-op, kept for compat - real sign-in is via /auth/login)
  const signIn = useCallback(async (name: string, email: string) => {
    // For live, redirect to /auth/login instead of localStorage
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }, []);

  return { profile, user, loading, signIn, signOut };
}
