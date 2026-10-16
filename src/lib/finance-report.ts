import type { Order, Product, StockPurchase } from "@/lib/types";

export const FINANCE_KINDS=["fee","refund","shipping_cost","packaging","operating_expense","correction"] as const;
export type FinanceKind=typeof FINANCE_KINDS[number];
export type FinanceAdjustment={id:string;kind:FinanceKind;amount:number;order_id:string|null;reference:string;description:string;occurred_at:string;created_at:string};
export const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const sum=(values:number[])=>money(values.reduce((a,b)=>a+b,0));
export function financeReport(orders:Order[],products:Product[],purchases:StockPurchase[],entries:FinanceAdjustment[]){
 const chargeable=orders.filter(o=>!["PENDING_PAYMENT","CANCELLED"].includes(o.status));
 const sales=sum(chargeable.map(o=>o.total));
 const bySku=new Map(products.map(p=>[p.sku,p]));
 const paidPurchaseCost=new Map<string,number>();
 for(const purchase of purchases){
  if(purchase.status!=="PAID")continue;
  for(const item of purchase.items)paidPurchaseCost.set(item.sku,(paidPurchaseCost.get(item.sku)??0)+item.cost);
 }
 let itemCosts=0,unknownCosts=0;
 for(const order of chargeable){
  for(const item of order.items){
   const product=bySku.get(item.sku);
   const cost=paidPurchaseCost.get(item.sku)??product?.cost;
   if(cost===undefined||!Number.isFinite(cost)){unknownCosts++;continue;}
   itemCosts+=cost;
  }
 }
 itemCosts=money(itemCosts);
 const adjustments=Object.fromEntries(FINANCE_KINDS.map(kind=>[kind,sum(entries.filter(e=>e.kind===kind).map(e=>e.amount))])) as Record<FinanceKind,number>;
 const expenseTotal=sum(FINANCE_KINDS.map(k=>adjustments[k]));
 const contribution=money(sales-itemCosts-expenseTotal);
 const refundedWithoutLedger=chargeable.filter(o=>o.status==="REFUNDED"&&!entries.some(e=>e.kind==="refund"&&e.order_id===o.id)).length;
 const channels=[...new Set(chargeable.map(o=>o.channel))].map(channel=>{
  const group=chargeable.filter(o=>o.channel===channel);
  const orderIds=new Set(group.map(o=>o.id));
  const attributed=entries.filter(e=>e.order_id&&orderIds.has(e.order_id));
  return {channel,orders:group.length,sales:sum(group.map(o=>o.total)),recordedAdjustments:sum(attributed.map(e=>e.amount))};
 });
 return {sales,itemCosts,unknownCosts,expenseTotal,adjustments,contribution,orders:chargeable.length,
  refundedWithoutLedger,unattributedAdjustments:entries.filter(e=>!e.order_id).length,
  channels,averageOrder:chargeable.length?money(sales/chargeable.length):0,
  isComplete:unknownCosts===0&&refundedWithoutLedger===0};
}
