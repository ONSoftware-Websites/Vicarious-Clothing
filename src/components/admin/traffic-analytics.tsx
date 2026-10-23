"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Analytics = {
  days: number; pageViews: number; sessions: number; uniqueVisitors: number;
  daily: { date: string; pageViews: number; sessions: number; visitors: number }[];
  topPages: { path: string; count: number }[];
  topReferrers: { host: string; count: number }[];
  capped?: boolean;
};
type ExcludedIp = { ip_address: string; label: string; created_at: string };

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="border border-line bg-cream p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</p><p className="mt-2 font-display text-3xl font-semibold">{value}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{detail}</p></div>;
}

export function TrafficAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [addresses, setAddresses] = useState<ExcludedIp[]>([]);
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [analyticsResponse, ipResponse] = await Promise.all([
        fetch("/api/admin/traffic?days=" + days, { cache: "no-store" }),
        fetch("/api/admin/traffic/excluded-ips", { cache: "no-store" }),
      ]);
      const analytics = await analyticsResponse.json();
      const excluded = await ipResponse.json();
      if (!analyticsResponse.ok) throw new Error(analytics.error || "Traffic analytics could not be loaded.");
      if (!ipResponse.ok) throw new Error(excluded.error || "IP exclusions could not be loaded.");
      setData(analytics); setAddresses(excluded.addresses ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  async function addIp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/traffic/excluded-ips", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ip, label }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this IP.");
      setIp(""); setLabel(""); setNotice("IP exclusion saved. New matching visits will be excluded.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this IP."); }
    finally { setSaving(false); }
  }

  async function removeIp(address: string) {
    if (!window.confirm("Remove " + address + " from the exclusion list? Future visits from this address may be counted.")) return;
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/traffic/excluded-ips?ip=" + encodeURIComponent(address), { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove this IP.");
      setNotice("IP exclusion removed."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not remove this IP."); }
  }

  const maxViews = Math.max(1, ...(data?.daily.map(day => day.pageViews) ?? [1]));
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Business / Website performance</p><h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight">Traffic analytics</h1><p className="mt-2 max-w-2xl text-sm text-ink-soft">First-party storefront analytics. Tracking runs only after optional analytics consent and excludes configured administrator IPs.</p></div>
      <div className="flex items-center gap-2"><label htmlFor="traffic-days" className="font-mono text-[10px] uppercase tracking-wider">Period</label><select id="traffic-days" value={days} onChange={e=>setDays(Number(e.target.value))} className="border border-line bg-paper px-3 py-3 text-sm"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button onClick={()=>void load()} className="border border-ink px-3 py-3 font-mono text-[10px] uppercase tracking-wider hover:bg-cream">Refresh</button></div>
    </header>

    {error && <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="border border-line bg-cream p-4 text-sm">{notice}</p>}
    {loading && <p className="text-sm text-ink-soft">Loading traffic data…</p>}
    {data && <>
      <section><h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Performance summary</h2><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Page views" value={data.pageViews.toLocaleString("en-GB")} detail={"Last " + days + " days"} />
        <Metric label="Sessions" value={data.sessions.toLocaleString("en-GB")} detail="Distinct browser sessions" />
        <Metric label="Unique visitors" value={data.uniqueVisitors.toLocaleString("en-GB")} detail="Consenting browsers" />
        <Metric label="Pages / session" value={data.sessions ? (data.pageViews / data.sessions).toFixed(1) : "0.0"} detail="Average engagement" />
      </div></section>
      <section className="border border-line bg-paper p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-sm font-bold uppercase tracking-wider">Page views over time</h2><span className="font-mono text-[10px] uppercase text-ink-faint">Daily totals</span></div>
        <div className="flex h-52 items-end gap-1 border-b border-line pb-1" role="img" aria-label={"Daily page views for the last " + days + " days"}>
          {data.daily.map((day)=><div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end" title={day.date + ": " + day.pageViews + " page views"}><div className="w-full bg-accent transition-opacity group-hover:opacity-70" style={{height: Math.max(day.pageViews ? 3 : 0, day.pageViews / maxViews * 100) + "%"}} /></div>)}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[9px] text-ink-faint"><span>{data.daily[0]?.date}</span><span>{data.daily[Math.floor(data.daily.length/2)]?.date}</span><span>{data.daily[data.daily.length-1]?.date}</span></div>
      </section>
      {data.capped && <p className="text-xs text-amber-800">The report reached its 50,000-event limit. Use a shorter date range for complete counts.</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-line"><div className="border-b border-line px-5 py-4"><h2 className="font-display text-sm font-bold uppercase tracking-wider">Most visited pages</h2></div>
          {data.topPages.length ? <div className="divide-y divide-line">{data.topPages.map(row=><div key={row.path} className="flex items-center justify-between gap-4 px-5 py-3"><span className="min-w-0 truncate text-sm">{row.path}</span><span className="font-mono text-xs">{row.count.toLocaleString("en-GB")}</span></div>)}</div> : <p className="p-5 text-sm text-ink-soft">No page views recorded for this period.</p>}
        </section>
        <section className="border border-line"><div className="border-b border-line px-5 py-4"><h2 className="font-display text-sm font-bold uppercase tracking-wider">Referring websites</h2></div>
          {data.topReferrers.length ? <div className="divide-y divide-line">{data.topReferrers.map(row=><div key={row.host} className="flex items-center justify-between gap-4 px-5 py-3"><span className="min-w-0 truncate text-sm">{row.host}</span><span className="font-mono text-xs">{row.count.toLocaleString("en-GB")}</span></div>)}</div> : <p className="p-5 text-sm text-ink-soft">No referral data recorded for this period.</p>}
        </section>
      </div>
    </>}
    <section className="space-y-4 border border-line p-5 sm:p-6">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">Configuration</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Excluded administrator IPs</h2><p className="mt-2 text-sm text-ink-soft">Matching traffic is discarded before an event is stored. IP addresses are not retained in page-view events. Use a public IP address for the network your device connects through.</p></div>
      <form onSubmit={addIp} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div><label htmlFor="exclude-ip" className="mb-1 block font-mono text-[10px] uppercase tracking-wider">IPv4 / IPv6 address</label><input id="exclude-ip" required value={ip} onChange={e=>setIp(e.target.value)} placeholder="e.g. 203.0.113.10" className="w-full border border-line bg-paper px-3 py-3 text-sm" /></div>
        <div><label htmlFor="exclude-label" className="mb-1 block font-mono text-[10px] uppercase tracking-wider">Description (optional)</label><input id="exclude-label" value={label} onChange={e=>setLabel(e.target.value)} maxLength={100} placeholder="e.g. Admin home network" className="w-full border border-line bg-paper px-3 py-3 text-sm" /></div>
        <button disabled={saving} className="self-end bg-ink px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-paper hover:bg-accent-deep disabled:opacity-50">{saving ? "Saving…" : "Add IP"}</button>
      </form>
      <div className="divide-y divide-line border-y border-line">
        {addresses.map(address=><div key={address.ip_address} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-mono text-sm">{address.ip_address}</p><p className="mt-1 text-xs text-ink-soft">{address.label || "No description"}</p></div><button type="button" onClick={()=>void removeIp(address.ip_address)} className="border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-wider hover:border-red-500 hover:text-red-700">Remove</button></div>)}
        {!addresses.length && <p className="py-4 text-sm text-ink-soft">No IP addresses excluded yet.</p>}
      </div>
      <p className="text-xs text-ink-faint">Exclusions apply to new events after the IP is saved; existing reports are not retroactively changed. Tracking requires optional analytics consent.</p>
    </section>
  </div>;
}
