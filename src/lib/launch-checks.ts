/** Non-secret configuration checks for production release readiness. */
export type LaunchCheck={name:string;ok:boolean;detail:string};
export function launchConfigurationChecks(env:Record<string,string|undefined>):LaunchCheck[]{
 const present=(key:string)=>Boolean(env[key]?.trim());
 const httpsSite=(()=>{try{const u=new URL(env.NEXT_PUBLIC_SITE_URL??"");return u.protocol==="https:"&&Boolean(u.hostname);}catch{return false;}})();
 const checks:[string,boolean,string][]=[
  ["Canonical HTTPS URL",httpsSite,"NEXT_PUBLIC_SITE_URL must be an absolute HTTPS URL"],
  ["Supabase endpoint",present("NEXT_PUBLIC_SUPABASE_URL"),"Set the public Supabase project URL"],
  ["Supabase public key",present("NEXT_PUBLIC_SUPABASE_ANON_KEY"),"Set Supabase's public client key"],
  ["Server database credentials",present("SUPABASE_SERVICE_ROLE_KEY"),"Service role only on server"],
  ["Stripe secret key",present("STRIPE_SECRET_KEY"),"Production Stripe API key"],
  ["Stripe publishable key",present("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),"Stripe public client key"],
  ["Stripe webhook secret",present("STRIPE_WEBHOOK_SECRET"),"Verify webhook signatures"],
  ["Transactional email provider",present("RESEND_API_KEY"),"Configure the Resend API key"],
  ["Scheduled task authentication",present("CRON_SECRET"),"The daily cron requires this bearer token"],
  ["Detailed health access",present("HEALTHCHECK_SECRET"),"Private operational health diagnostics"],
  ["Order link signing",present("ORDER_ACCESS_SECRET"),"Stable order-access links"],
  ["Seller offer link signing",present("LEAD_OFFER_SECRET"),"Stable seller offer links"],
 ];
 return checks.map(([name,ok,detail])=>({name,ok,detail}));
}
