import {describe,it,expect} from "vitest";
import {ORDER_TRANSITIONS,LEAD_TRANSITIONS,REQUIRED_CHECKS} from "./workflow-transitions";

describe("Release 10 order fulfilment rules",()=>{
 it("requires sequential paid-picking-packed-dispatched progression",()=>{
  expect(ORDER_TRANSITIONS.PAID).toContain("PICKING");
  expect(ORDER_TRANSITIONS.PAID).not.toContain("DISPATCHED");
  expect(ORDER_TRANSITIONS.PICKING).not.toContain("DISPATCHED");
  expect(ORDER_TRANSITIONS.READY_TO_DISPATCH).toContain("DISPATCHED");
 });
 it("returns need a request then receipt and inspection",()=>{
  expect(ORDER_TRANSITIONS.DELIVERED).toContain("RETURN_REQUESTED");
  expect(ORDER_TRANSITIONS.DELIVERED).not.toContain("RETURNED");
  expect(ORDER_TRANSITIONS.RETURN_REQUESTED).toContain("RETURNED");
  expect(ORDER_TRANSITIONS.RETURNED).toContain("REFUNDED");
 });
 it("cannot change closed paid/refunded/cancelled orders",()=>{
  expect(ORDER_TRANSITIONS.REFUNDED).toEqual([]);
  expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
 });
 it("requires documented parcel checklists",()=>{
  expect(REQUIRED_CHECKS.packing).toEqual(["itemsChecked","addressChecked","packagingChecked"]);
  expect(REQUIRED_CHECKS.return).toContain("itemReceived");
 });
});
describe("Release 10 acquisition rules",()=>{
 it("does not skip review, receipt or inspection",()=>{
  expect(LEAD_TRANSITIONS.NEW).toContain("REVIEWING");
  expect(LEAD_TRANSITIONS.NEW).not.toContain("PAID");
  expect(LEAD_TRANSITIONS.ACCEPTED).toEqual(["RECEIVED"]);
  expect(LEAD_TRANSITIONS.RECEIVED).toEqual(["INSPECTED"]);
 });
 it("does not permit a direct PAID status without financial reconciliation",()=>{
  expect(LEAD_TRANSITIONS.INSPECTED).not.toContain("PAID");
  expect(LEAD_TRANSITIONS.PAID).toEqual([]);
 });
});
