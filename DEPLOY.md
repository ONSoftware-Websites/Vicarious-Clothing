# Deploying Vicarious Clothing to Vercel

The production application depends on **Supabase, Stripe and Resend**. Local development can still use demo data/payment behaviour, but production intentionally fails closed if durable storage or payments are unavailable.

## 1. Vercel project

Import `ONSoftware-Websites/Vicarious-Clothing` into Vercel.

- Framework: Next.js
- Build command: `npm run build`
- Node: 22.x is recommended (`package.json` requires >=20.9)
- Production branch: `master`

Never commit a real `.env` file. `.env.example` is the configuration template.

## 2. Required production environment variables

Add these under Vercel → Project Settings → Environment Variables for **Production**. Use separate test credentials for Preview.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://vicariousclothing.co.uk` |
| `ADMIN_PASSWORD` | Protects `/admin` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public browser/server-session auth key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only application/database key |
| `STRIPE_SECRET_KEY` | Server payment key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Payment Element browser key |
| `STRIPE_WEBHOOK_SECRET` | Signature secret for the production webhook |
| `RESEND_API_KEY` | Transactional email delivery |
| `ORDER_ACCESS_SECRET` | Long random HMAC secret for guest order links |
| `LEAD_OFFER_SECRET` | Long random HMAC secret for sell-to-us links |

Optional:

- `PASSWORD_RESET_EXPIRY_LABEL=1 hour` — display text in the reset email. Keep it aligned with Supabase Auth's configured recovery expiry.
- `SEED_DEMO=false` — recommended on Production and Preview.

`SUPABASE_SERVICE_ROLE_KEY`, `ORDER_ACCESS_SECRET`, `LEAD_OFFER_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` and `ADMIN_PASSWORD` must never be exposed in client-side code.

## 3. Supabase database and storage

For a new project, run these in the Supabase SQL editor in order:

1. `supabase/schema.sql`
2. `supabase/repair-2026-08-23.sql`

The repair migration installs the atomic one-of-one inventory claim used by checkout, atomic discount finalisation and the `lead-photos` Storage bucket used by Sell To Us.

Only run `supabase/seed.sql` in an environment where you intentionally want demo stock.

### Auth URL configuration

In Supabase → Authentication → URL Configuration:

- Site URL: `https://vicariousclothing.co.uk`
- Allowed redirect URL: `https://vicariousclothing.co.uk/auth/callback`
- Add your Preview callback URL separately when testing auth in Preview.

The browser and customer-session clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only. The service-role key remains server-only.

## 4. Stripe

The storefront uses Stripe Payment Element. Production does **not** fall back to demo checkout if Stripe is missing.

Configure this webhook endpoint in Stripe:

`https://vicariousclothing.co.uk/api/webhooks/stripe`

Events:

- `payment_intent.succeeded` — required
- `payment_intent.payment_failed` — recommended

Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET`.

The browser completion request and Stripe webhook are both idempotent. The webhook is still essential for payment methods that redirect away from the checkout page.

## 5. Resend

Verify `vicariousclothing.co.uk` in Resend and complete its SPF/DKIM DNS requirements.

The application sends transactional mail from:

`notifications@vicariousclothing.co.uk`

Set `RESEND_API_KEY` in Vercel. In production, failed/missing email configuration is treated as a real delivery failure rather than silently writing an HTML file.

## 6. Domain

Add `vicariousclothing.co.uk` to the Vercel project and follow Vercel's DNS instructions. After the domain is active, ensure `NEXT_PUBLIC_SITE_URL` is the canonical HTTPS domain and redeploy.

## 7. Health check

After deployment open:

`https://vicariousclothing.co.uk/api/health`

A production-ready deployment should return `ok: true`. It checks:

- required configuration;
- core Supabase tables;
- the atomic `claim_inventory` RPC;
- the Sell To Us photo bucket.

Do not treat a deployment as ready while this endpoint is returning 500/503.

## 8. End-to-end checks

Before taking real orders:

- [ ] `/` and `/shop` load real Supabase inventory.
- [ ] `/admin` requires the configured password.
- [ ] Create and verify a customer account; the branded welcome email arrives.
- [ ] Request a password reset; the branded reset email opens the password-update flow.
- [ ] Submit Sell To Us with photos; staff can see the photos in Admin.
- [ ] Send a sell-to-us offer; Accept and Decline links update the lead correctly.
- [ ] Place a Stripe test order; Stripe records the payment and Admin shows the order as paid.
- [ ] The confirmation email opens the protected order page.
- [ ] Save tracking before marking an order dispatched; the dispatch email contains tracking.
- [ ] Mark a test Stripe order refunded; local status changes only after Stripe accepts the refund.
- [ ] Verify `/api/health` still reports `ok: true`.

## 9. Operational notes

- Production writes require Supabase. If the durable data service is unavailable, API mutations return 503 instead of pretending to succeed in serverless memory.
- Website customers must use `/api/checkout`; the legacy `/api/orders` creation route is staff-only.
- Customer order pages require either the matching authenticated account, a signed email link or the signed HttpOnly cookie issued at checkout.
- One-of-one stock is claimed atomically when a pending order is created, not simply because someone opened checkout.
- Every push to `master` triggers a Vercel production deployment. Use a separate preview branch plus Stripe test credentials for staging.
