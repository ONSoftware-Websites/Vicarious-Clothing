import { describe, it, expect } from "vitest";
import {canSafelyCancelCheckoutIntent,paymentNeedsSettlement,paymentMustRemainReserved} from "./checkout-payment-state";

describe("one-of-one checkout payment state safeguards",()=>{
  for(const status of ["requires_payment_method","requires_confirmation","requires_action","requires_capture"])
    it(`permits cancel before settlement: ${status}`,()=>{
      expect(canSafelyCancelCheckoutIntent(status)).toBe(true);
      expect(paymentNeedsSettlement(status)).toBe(false);
    });
  for(const status of ["processing","succeeded"])
    it(`never releases stock while payment is ${status}`,()=>{
      expect(canSafelyCancelCheckoutIntent(status)).toBe(false);
      expect(paymentMustRemainReserved(status)).toBe(true);
    });
  it("recognises a completed payment for reconciliation",()=>{
    expect(paymentNeedsSettlement("succeeded")).toBe(true);
    expect(paymentNeedsSettlement("processing")).toBe(false);
  });
  it("a canceled attempt needs no further Stripe cancellation",()=>{
    expect(canSafelyCancelCheckoutIntent("canceled")).toBe(false);
  });
});
