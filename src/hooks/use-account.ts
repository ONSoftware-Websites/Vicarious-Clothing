"use client";

import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface AccountProfile {
  name: string;
  email: string;
}

const KEY = "vc_account";
const EMPTY: AccountProfile | null = null;

function parse(raw: string | null): AccountProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AccountProfile;
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

function serialize(value: AccountProfile | null): string {
  return JSON.stringify(value);
}

export function useAccount() {
  const [profile, setProfile] = useLocalStorage<AccountProfile | null>(
    KEY,
    EMPTY,
    parse,
    serialize
  );

  const signIn = useCallback(
    (name: string, email: string) => {
      setProfile({ name, email });
    },
    [setProfile]
  );

  const signOut = useCallback(() => {
    setProfile(null);
  }, [setProfile]);

  return { profile, signIn, signOut };
}
