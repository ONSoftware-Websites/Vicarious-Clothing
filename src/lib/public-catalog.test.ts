import { describe,expect,it } from "vitest";
import { isPublicProduct,isPurchasableProduct,parsePriceFilter } from "./public-catalog";

describe("public product visibility",()=>{
 it("permits publicly viewable available, reserved and sold items",()=>{
   for(const status of ["AVAILABLE","RESERVED","SOLD"] as const)
     expect(isPublicProduct({status})).toBe(true);
 });
 it("does not expose draft or archived items",()=>{
   expect(isPublicProduct({status:"DRAFT"})).toBe(false);
   expect(isPublicProduct({status:"ARCHIVED"})).toBe(false);
 });
 it("only allows available garments into a fresh checkout",()=>{
   expect(isPurchasableProduct({status:"AVAILABLE"})).toBe(true);
   expect(isPurchasableProduct({status:"RESERVED"})).toBe(false);
   expect(isPurchasableProduct({status:"SOLD"})).toBe(false);
 });
});
describe("price filter validation",()=>{
 it("ignores malformed, negative and infinite prices",()=>{
   for(const v of ["abc","NaN","Infinity","-2"])expect(parsePriceFilter(v)).toBeUndefined();
 });
 it("accepts zero and ordinary decimal prices",()=>{
   expect(parsePriceFilter("0")).toBe(0);
   expect(parsePriceFilter("25.50")).toBe(25.5);
 });
});
