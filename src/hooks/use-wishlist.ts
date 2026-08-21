"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const KEY = "vc_wishlist";
const EMPTY: string[] = [];

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [localSkus, setLocalSkus] = useLocalStorage<string[]>(KEY, EMPTY, parse, JSON.stringify);
  const [remoteSkus, setRemoteSkus] = useState<string[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    const supabase = (() => {
      try { return createSupabaseBrowser(); } catch { return null; }
    })();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Fetch remote wishlist when logged in
  useEffect(() => {
    if (!userId) {
      setRemoteSkus(null);
      return;
    }
    const supabase = (() => {
      try { return createSupabaseBrowser(); } catch { return null; }
    })();
    if (!supabase) return;
    (async () => {
      // Ensure wishlist row exists
      const { data: wl } = await supabase.from("wishlists").select("id").eq("profile_id", userId).maybeSingle();
      let wishlistId = wl?.id as string | undefined;
      if (!wishlistId) {
        const { data: created, error } = await supabase.from("wishlists").insert({ profile_id: userId }).select("id").single();
        if (!error && created) wishlistId = created.id as string;
      }
      if (!wishlistId) {
        setRemoteSkus([]);
        return;
      }
      const { data: items } = await supabase.from("wishlist_items").select("sku").eq("wishlist_id", wishlistId);
      setRemoteSkus((items ?? []).map((r: { sku: string }) => r.sku));
    })();
  }, [userId]);

  const skus = remoteSkus !== null ? remoteSkus : localSkus;
  const isRemote = remoteSkus !== null;

  const syncRemote = useCallback(async (nextSkus: string[]) => {
    if (!userId) return;
    const supabase = (() => {
      try { return createSupabaseBrowser(); } catch { return null; }
    })();
    if (!supabase) return;
    const { data: wl } = await supabase.from("wishlists").select("id").eq("profile_id", userId).maybeSingle();
    let wishlistId = wl?.id as string | undefined;
    if (!wishlistId) {
      const { data: created } = await supabase.from("wishlists").insert({ profile_id: userId }).select("id").single();
      wishlistId = (created as { id: string } | null)?.id;
    }
    if (!wishlistId) return;
    // Simple sync: delete all then insert next
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId);
    if (nextSkus.length) {
      await supabase.from("wishlist_items").insert(nextSkus.map((sku) => ({ wishlist_id: wishlistId, sku })));
    }
    setRemoteSkus(nextSkus);
  }, [userId]);

  const toggle = useCallback((sku: string) => {
    const next = skus.includes(sku) ? skus.filter((s) => s !== sku) : [...skus, sku];
    if (isRemote) syncRemote(next);
    else setLocalSkus(next);
  }, [skus, isRemote, setLocalSkus, syncRemote]);

  const has = useCallback((sku: string) => skus.includes(sku), [skus]);

  const remove = useCallback((sku: string) => {
    const next = skus.filter((s) => s !== sku);
    if (isRemote) syncRemote(next);
    else setLocalSkus(next);
  }, [skus, isRemote, setLocalSkus, syncRemote]);

  // On login, merge local into remote once
  useEffect(() => {
    if (isRemote && localSkus.length > 0) {
      const merged = [...new Set([...remoteSkus, ...localSkus])];
      syncRemote(merged);
      setLocalSkus([]);
    }
  }, [isRemote]); // eslint-disable-line react-hooks/exhaustive-deps

  return { skus, has, toggle, remove, count: skus.length };
}
