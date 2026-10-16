import { describe,it,expect } from "vitest";
import { paymentIntentMatchesOrder } from "./stripe-payment-validation";

const order={id:"VC-100",total:46.25,paymentIntentId:"pi_expected"};
const intent={id:"pi_expected",status:"succeeded",amount:4625,currency:"gbp",metadata:{orderId:"VC-100"}};

describe("Stripe finalisation binding",()=>{
 it("accepts a matching successful GBP intent",()=>expect(paymentIntentMatchesOrder(intent,order)).toBe(true));
 it("rejects a pending payment",()=>expect(paymentIntentMatchesOrder({...intent,status:"requires_action"},order)).toBe(false));
 it("rejects another order reference",()=>expect(paymentIntentMatchesOrder({...intent,metadata:{orderId:"VC-101"}},order)).toBe(false));
 it("rejects another currency",()=>expect(paymentIntentMatchesOrder({...intent,currency:"usd"},order)).toBe(false));
 it("rejects mismatched amounts",()=>expect(paymentIntentMatchesOrder({...intent,amount:4624},order)).toBe(false));
 it("rejects an unrelated intent",()=>expect(paymentIntentMatchesOrder({...intent,id:"pi_other"},order)).toBe(false));
 it("rejects an invalid total",()=>expect(paymentIntentMatchesOrder(intent,{...order,total:NaN})).toBe(false));
});
