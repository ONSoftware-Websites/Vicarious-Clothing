"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface LocalStore<T> {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
}

const stores = new Map<string, LocalStore<unknown>>();

function getStore<T>(
  key: string,
  fallback: T,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string
): LocalStore<T> {
  let store = stores.get(key) as LocalStore<T> | undefined;
  if (!store) {
    let cache: T | undefined;
    const listeners = new Set<() => void>();
    store = {
      subscribe(cb: () => void) {
        if (typeof window === "undefined") return () => {};
        const onLocal = (e: Event) => {
          if ((e as CustomEvent).detail === key) {
            cache = undefined;
            cb();
          }
        };
        const onStorage = () => {
          cache = undefined;
          cb();
        };
        listeners.add(cb);
        window.addEventListener("vc-local-storage", onLocal as EventListener);
        window.addEventListener("storage", onStorage);
        return () => {
          listeners.delete(cb);
          window.removeEventListener("vc-local-storage", onLocal as EventListener);
          window.removeEventListener("storage", onStorage);
        };
      },
      getSnapshot() {
        if (typeof window === "undefined") return fallback;
        if (cache !== undefined) return cache;
        try {
          cache = parse(window.localStorage.getItem(key));
        } catch {
          cache = fallback;
        }
        return cache;
      },
      getServerSnapshot() {
        return fallback;
      },
      set(value: T) {
        cache = value;
        window.localStorage.setItem(key, serialize(value));
        listeners.forEach((cb) => cb());
      },
    };
    stores.set(key, store as LocalStore<unknown>);
  }
  return store;
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string
): [T, (value: T) => void] {
  const store = getStore(key, fallback, parse, serialize);
  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
  return [value, store.set];
}
