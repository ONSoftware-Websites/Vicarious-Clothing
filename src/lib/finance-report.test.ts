import {describe,it,expect} from "vitest";
import {financeReport,type FinanceAdjustment} from "./finance-report";
import type {Order,Product,StockPurchase} from "./types";
const order=(overrides:Partial<Order>={}):Order=>({
 id:"VC-11",email:"test@example.invalid",name:"Test",status:"DELIVERED",
 items:[{sku:"SKU1",name:"Jacket",brand:"TestBrand",size:"M",condition:"GOOD",price:60,image:""}],
 subtotal:60,delivery:5,total:65,address:{line1:"a",city:"b",postcode:"AB1 2CD",country:"UK"},
 channel:"website",paymentProvider:"stripe",createdAt:"2026-10-16T12:00:00Z",updatedAt:"2026-10-16T12:00:00Z",
 ...overrides
} as Order);
const product={sku:"SKU1",cost:20} as Product;
const adjustment=(kind:FinanceAdjustment["kind"],amount:number,order_id:string|null="VC-11"):FinanceAdjustment=>({
 id:kind,kind,amount,order_id,reference:kind,description:"",occurred_at:"2026-10-16",created_at:"2026-10-16"
});
describe("Release 11 operational reconciliation",()=>{
 it("deducts known costs, fees, postage and refunds once",()=>{
  const result=financeReport([order()],[product],[],[
   adjustment("fee",2),adjustment("shipping_cost",3),adjustment("refund",10)
  ]);
  expect(result.sales).toBe(65);
  expect(result.itemCosts).toBe(20);
  expect(result.expenseTotal).toBe(15);
  expect(result.contribution).toBe(30);
  expect(result.isComplete).toBe(true);
 });
 it("reports missing acquisition cost without representing estimate as complete",()=>{
  const result=financeReport([order()],[],[],[]);
  expect(result.unknownCosts).toBe(1);
  expect(result.isComplete).toBe(false);
 });
 it("flags fully refunded orders without a matching refund entry",()=>{
  const result=financeReport([order({status:"REFUNDED"})],[product],[],[]);
  expect(result.refundedWithoutLedger).toBe(1);
  expect(result.isComplete).toBe(false);
 });
 it("excludes pending and cancelled orders from booked sales",()=>{
  const result=financeReport([order({status:"CANCELLED"}),order({id:"VC-12",status:"PENDING_PAYMENT"})],[],[],[]);
  expect(result.sales).toBe(0);
  expect(result.orders).toBe(0);
 });
 it("prefers recorded acquisition allocation and provides channel/promotion attribution",()=>{
  const purchase={status:"PAID",items:[{sku:"SKU1",name:"Jacket",brand:"TestBrand",cost:24}]} as StockPurchase;
  const result=financeReport([order({discount:{code:"SAVE5",description:"",amount:5,type:"fixed"}})],[product],[purchase],[]);
  expect(result.itemCosts).toBe(24);
  expect(result.channels[0].sales).toBe(65);
  expect(result.promotions[0].code).toBe("SAVE5");
  expect(result.promotions[0].discountRecorded).toBe(5);
  expect(result.monthly[0].month).toBe("2026-10");
 });
});
