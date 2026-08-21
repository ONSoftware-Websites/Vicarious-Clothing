"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewsletterSendForm({ count }: { count: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const send = async (isTest: boolean) => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body required."); return; }
    if (isTest && !testEmail.includes("@")) { setError("Enter a test email."); return; }
    if (!isTest && count === 0) { setError("No subscribers to send to."); return; }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), preheader: preheader.trim(), body: body.trim(), testEmail: isTest ? testEmail.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(isTest ? `Test sent to ${testEmail}` : `Sent to ${data.sent} subscribers`);
      if (isTest) setTestEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line p-5">
      <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-[0.18em]">Send newsletter</h2>
      <p className="mb-4 text-xs leading-relaxed text-ink-faint">Compose and send to all {count} subscribers via Resend. Includes unsubscribe note. Test first.</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="ns-subject" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Subject *</label>
          <input id="ns-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New drop: 12 pieces just landed" className="h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ns-preheader" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Preheader (preview text)</label>
          <input id="ns-preheader" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Vintage Carhartt, Nike, and more — one of one" className="h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none" />
        </div>
        <div>
          <label htmlFor="ns-body" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Body * (plain text, paragraphs separated by blank line)</label>
          <textarea id="ns-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Hi —\n\nA dozen new pieces just hit the shop, including a Carhartt Detroit in Very Good and a Patagonia Retro-X.\n\nShop new in → https://vicariousclothing.co.uk/shop/new-in\n\nSee you there,\nHenry"} className="w-full border border-line bg-paper p-3 text-sm leading-relaxed focus:border-ink focus:outline-none" />
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="ns-test" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Test email</label>
            <input id="ns-test" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" className="h-11 w-full border border-line bg-paper px-3 text-sm focus:border-ink focus:outline-none" />
          </div>
          <button type="button" disabled={busy} onClick={() => send(true)} className="flex h-11 items-center justify-center border border-ink px-6 font-display text-xs font-medium uppercase tracking-[0.16em] hover:bg-ink hover:text-paper disabled:opacity-50">
            {busy ? "Sending…" : "Send test"}
          </button>
        </div>

        <button type="button" disabled={busy} onClick={() => send(false)} className="flex h-11 w-full items-center justify-center bg-ink px-6 font-display text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-accent disabled:opacity-50">
          {busy ? "Sending…" : `Send to ${count} subscriber${count === 1 ? "" : "s"}`}
        </button>

        {error && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-red-700">{error}</p>}
        {result && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-emerald-700">{result}</p>}
      </div>
    </div>
  );
}
