/** Shared Stripe order validation used by browser finalisation and webhook handlers. */
export interface PaymentOrderReference {
  id:string;
  total:number;
  paymentIntentId?:string;
}
export interface StripeIntentReference {
  id:string;
  status:string;
  amount:number;
  currency:string;
  metadata: {orderId?:string} | null;
}
export function paymentIntentMatchesOrder(intent:StripeIntentReference,order:PaymentOrderReference):boolean {
  return intent.status==="succeeded"
    && intent.metadata?.orderId===order.id
    && intent.currency.toLowerCase()==="gbp"
    && Number.isFinite(order.total)
    && Math.round(order.total*100)===intent.amount
    && (!order.paymentIntentId || order.paymentIntentId===intent.id);
}
