import { requireAdminApi } from "@/lib/server/admin-auth";
import { sendEmail, type EmailTemplate } from "@/lib/server/mailer";
import { sendAdminOrderAlertOnce } from "@/lib/server/order-alerts";
import type { Order } from "@/lib/types";
import { recordOperationalEvent } from "@/lib/server/operational-events";

const TEST_TO = "admin@vicariousclothing.co.uk";
const types = ["welcome","order-confirmed","order-dispatched","order-delivered","order-refunded","order-cancelled","password-reset","lead-enquiry","lead-offer","admin-order-alert"] as const;
type TestKind=(typeof types)[number];

function fixture() {
 const now=new Date().toISOString();
 const order:Order={
  id:"TEST-NOTIFICATION",email:TEST_TO,name:"Notification Test",status:"PAID",
  items:[{sku:"TEST-ONLY",name:"Sample vintage jacket",brand:"Vicarious",size:"M",condition:"good",price:24,image:""}],
  subtotal:24,delivery:0,total:24,channel:"website",paymentProvider:"demo",
  address:{line1:"Test address — no delivery",city:"Test City",postcode:"AA1 1AA",country:"United Kingdom"},
  createdAt:now,updatedAt:now,
  carrier:"Royal Mail",tracking:"TEST-TRACKING-NOT-REAL"
 };
 const lead={id:"TEST-LEAD",email:TEST_TO,name:"Notification Test",brand:"Vicarious",itemType:"Sample jacket",size:"M",condition:"good",offer:"24",offerExpiry:"7 days",notes:"Test notification only"};
 return {order,lead};
}

// Runs the production notification renderer/sender. No real account, order,
// Stripe payment, refund, inventory or lead is created or transitioned.
export async function POST(request:Request) {
 const denied=await requireAdminApi("OWNER");if(denied)return denied;
 try{
  const body=await request.json().catch(()=>({}));
  const kind=String(body.kind??"") as TestKind;
  if(!types.includes(kind))return Response.json({error:"Unknown notification type"},{status:400});
  const {order,lead}=fixture();
  if(kind==="admin-order-alert") {
   const result=await sendAdminOrderAlertOnce(order,TEST_TO);
   if(!result.notified)throw new Error("The notification provider did not accept the test");
  } else {
   const data:Record<string,unknown> = kind==="lead-enquiry"||kind==="lead-offer"
      ? lead : kind==="password-reset"
      ? {name:"Notification Test",link:"https://vicariousclothing.co.uk/auth/reset",expiryTime:"test only — no reset token"}
      : kind==="welcome" ? {name:"Notification Test"} : {order,refundAmount:24,refundReference:"TEST-REFUND",cancellationReason:"Test only — no real cancellation",refundInformation:"Test notification only"};
   const result=await sendEmail({to:TEST_TO,template:kind as EmailTemplate,data});
   if(result!=="sent")throw new Error("Email was only logged, not sent");
  }
  await recordOperationalEvent("email","info","maintenance_notification_test",{template:kind,recipient:TEST_TO});
  return Response.json({ok:true,kind,recipient:TEST_TO,providerAccepted:true});
 }catch(error){
  console.error("Maintenance notification test failed",error);
  return Response.json({error:error instanceof Error?error.message:"Notification test failed"},{status:502});
 }
}
