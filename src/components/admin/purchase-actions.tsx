"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PurchaseActions({
  id,
  paid,
}: {
  id: string;
  paid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference,setReference]=useState("");
  const [open,setOpen]=useState(false);

  const markPaid = async () => {
    if(!window.confirm("Confirm this seller has actually been paid outside the website? This records a completed payment, it does not send money."))return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "paid", id, paymentReference:reference.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not mark paid");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark paid");
    } finally {
      setBusy(false);
    }
  };

  if (paid) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
        Paid
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {!open?<button type="button" onClick={()=>setOpen(true)} className="font-mono text-[10px] uppercase text-accent-deep underline underline-offset-2">Record seller payment</button>:
       <div className="max-w-xs space-y-2">
        <label htmlFor={`payment-ref-${id}`} className="block font-mono text-[10px] uppercase">External payment reference</label>
        <input id={`payment-ref-${id}`} maxLength={120} value={reference} onChange={e=>setReference(e.target.value)} placeholder="Bank transfer / payment reference" className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs"/>
        <button type="button" disabled={busy||reference.trim().length<4} onClick={markPaid} className="bg-ink px-4 py-2 font-mono text-[10px] uppercase text-paper disabled:opacity-40">{busy?"Saving…":"Confirm recorded payment"}</button>
       </div>}
      {error&&<p role="alert" className="font-mono text-[10px] text-red-700">{error}</p>}
    </div>
  )
}
