export const SELLERHQ_MAX_ATTEMPTS=8;
export function sellerHqRetryPolicy(previousAttempts:number){
 const attempts=Math.max(0,Math.floor(previousAttempts))+1;
 const terminal=attempts>=SELLERHQ_MAX_ATTEMPTS;
 const delaySeconds=Math.min(3600,30*2**Math.min(attempts,7));
 return {attempts,terminal,delaySeconds,status:terminal?"dead_letter" as const:"failed" as const};
}
