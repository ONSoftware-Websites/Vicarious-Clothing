import { requireRole } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { OrderDeleteButton } from "@/components/admin/order-delete-button";
import { listOrders } from "@/lib/server/store";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Orders" };

const STATUS_TONE: Record<string, string> = {
  PENDING_PAYMENT: "border-amber-300 bg-amber-100 text-amber-900",
  PAID: "border-accent bg-accent-tint text-accent-deep",
  PICKING: "border-line bg-cream text-ink",
  READY_TO_DISPATCH: "border-amber-200 bg-amber-50 text-amber-800",
  DISPATCHED: "border-blue-200 bg-blue-50 text-blue-800",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  REFUNDED: "border-red-200 bg-red-50 text-red-800",
  RETURNED: "border-orange-200 bg-orange-50 text-orange-800",
  RETURN_REQUESTED: "border-orange-200 bg-orange-50 text-orange-800",
};

export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!(await requireRole("ADMIN"))) redirect("/admin");
  const allOrders = await listOrders();
  const raw = await searchParams;
  const query = typeof raw.q==="string"?raw.q.trim().toLowerCase():"";
  const status = typeof raw.status==="string"?raw.status:"";
  const statuses = new Set(["PENDING_PAYMENT","PAID","PICKING","READY_TO_DISPATCH","DISPATCHED","DELIVERED","RETURN_REQUESTED","RETURNED","REFUNDED","CANCELLED"]);
  const filterStatus = statuses.has(status)?status:"";
  const queue = typeof raw.queue==="string"?raw.queue:"";
  const orders = allOrders.filter(o=>(!filterStatus||o.status===filterStatus)&&(!queue||(queue==="fulfilment"&&["PAID","PICKING","READY_TO_DISPATCH"].includes(o.status))||(queue==="returns"&&["RETURN_REQUESTED","RETURNED"].includes(o.status)))&&(!query||[o.id,o.name,o.email,...o.items.map(i=>i.name)].join(" ").toLowerCase().includes(query)));
  const fulfillment = allOrders.filter(o=>["PAID","PICKING","READY_TO_DISPATCH"].includes(o.status)).length;
  const returns = allOrders.filter(o=>["RETURN_REQUESTED","RETURNED"].includes(o.status)).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Orders
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([["All orders",allOrders.length,""],["To fulfil",fulfillment,"queue=fulfilment"],["Returns",returns,"queue=returns"],["Pending payment",allOrders.filter(o=>o.status==="PENDING_PAYMENT").length,"PENDING_PAYMENT"]] as const).map(([label,count,key])=><Link key={label} href={key?`/admin/orders?${key.startsWith("queue=")?key:`status=${key}`}`:"/admin/orders"} className="border border-line bg-cream p-4 hover:border-accent">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</span><span className="mt-2 block font-display text-2xl font-semibold">{count}</span>
        </Link>)}
      </div>
      <form className="mb-6 flex flex-wrap gap-3" action="/admin/orders">
        {queue&&<input type="hidden" name="queue" value={queue}/>}
        <label htmlFor="orders-q" className="sr-only">Search orders</label>
        <input id="orders-q" name="q" defaultValue={typeof raw.q==="string"?raw.q:""} placeholder="Order number, customer, email, item…" className="h-11 min-w-0 flex-1 border border-line bg-paper px-4 text-sm sm:max-w-md"/>
        <label htmlFor="orders-status" className="sr-only">Filter by order status</label>
        <select id="orders-status" name="status" defaultValue={filterStatus} className="h-11 border border-line bg-paper px-3 font-mono text-xs uppercase">
          <option value="">All statuses</option>
          {Array.from(statuses).map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}
        </select>
        <button className="h-11 bg-ink px-5 font-display text-xs font-semibold uppercase tracking-wider text-paper" type="submit">Apply</button>
        <Link href="/admin/orders" className="flex h-11 items-center font-mono text-xs uppercase text-ink-soft underline underline-offset-4">Clear</Link>
      </form>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Order</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Customer</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Items</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Total</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Date</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-line hover:bg-cream/50">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-xs uppercase tracking-[0.12em] hover:text-accent-deep"
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{order.name}</p>
                  <p className="font-mono text-[10px] text-ink-faint">
                    {order.email} · {order.channel}
                    {order.paymentProvider === "stripe" ? " · stripe" : ""}
                  </p>
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {order.items.map((i) => i.name).join(", ")}
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatPrice(order.total)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_TONE[order.status] ?? "border-line text-ink-faint"}`}
                  >
                    {order.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-xs">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3"><Link href={`/admin/orders/${order.id}`} className="font-mono text-[10px] uppercase text-accent-deep underline underline-offset-2">Manage</Link><OrderDeleteButton id={order.id} /></div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No orders match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
