import {describe,expect,it} from "vitest";
import {SELLERHQ_MAX_ATTEMPTS,sellerHqRetryPolicy} from "./sellerhq-retry-policy";
describe("SellerHQ bounded recovery",()=>{
 it("starts with a retry and exponential backoff",()=>{
  expect(sellerHqRetryPolicy(0)).toEqual({attempts:1,terminal:false,delaySeconds:60,status:"failed"});
  expect(sellerHqRetryPolicy(2).delaySeconds).toBe(240);
 });
 it("sends the eighth failure to manual recovery",()=>{
  expect(sellerHqRetryPolicy(SELLERHQ_MAX_ATTEMPTS-2).terminal).toBe(false);
  expect(sellerHqRetryPolicy(SELLERHQ_MAX_ATTEMPTS-1)).toMatchObject({terminal:true,status:"dead_letter"});
 });
 it("caps delays and does not wrap attempts",()=>{
  expect(sellerHqRetryPolicy(20)).toMatchObject({terminal:true,delaySeconds:3600});
 });
});
