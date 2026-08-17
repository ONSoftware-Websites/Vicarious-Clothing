"use client";

import { useState, type FormEvent } from "react";
import { AccountShell } from "@/components/account-shell";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Address } from "@/lib/types";

const KEY = "vc_addresses";
const EMPTY: Address[] = [];

function parse(raw: string | null): Address[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Address[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useLocalStorage<Address[]>(
    KEY,
    EMPTY,
    parse,
    JSON.stringify
  );
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!line1 || !city || !postcode) return;
    setAddresses([
      ...addresses,
      { line1, line2: line2 || undefined, city, postcode, country: "United Kingdom" },
    ]);
    setLine1("");
    setLine2("");
    setCity("");
    setPostcode("");
  };

  const remove = (i: number) => {
    setAddresses(addresses.filter((_, idx) => idx !== i));
  };

  return (
    <AccountShell>
      <h2 className="mb-6 font-display text-lg font-semibold uppercase tracking-tight">
        Addresses
      </h2>

      {addresses.length > 0 && (
        <ul className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <li key={i} className="border border-line p-5">
              <p className="text-sm leading-relaxed">
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.postcode}
                <br />
                {a.country}
              </p>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="max-w-md space-y-4 border-t border-line pt-8">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
          Add an address
        </h3>
        <div>
          <label htmlFor="ad-line1" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Address line 1
          </label>
          <input
            id="ad-line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="ad-line2" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            Address line 2 (optional)
          </label>
          <input
            id="ad-line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ad-city" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              City
            </label>
            <input
              id="ad-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="ad-postcode" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              Postcode
            </label>
            <input
              id="ad-postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="h-12 w-full border border-line bg-paper px-4 text-sm focus:border-ink focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center border border-ink font-display text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-paper"
        >
          Save address
        </button>
      </form>
    </AccountShell>
  );
}
