# Making Vicarious Clothing Functional — Setup & Manual Input Guide

Everything in the blueprint is now implemented. This guide explains exactly what
works out of the box, what you must provide manually, and the order to do it in.

---

## 1. What works right now (no setup needed)

```bash
npm install
npm run dev     # http://localhost:3000
```

- Full storefront, checkout, admin, discounts, emails, analytics, marketplace layer
- Admin login: go to `/admin`, password `ADMINPASSWORD123` (from `.env`)
- Checkout runs in **demo mode** — no real payment is taken, orders still go
  through the full reservation → sold flow
- Emails are **written to files** in `.data/emails/` instead of being sent
  (view them any time at `/admin/emails`)
- Demo data (28 seeded products, orders, leads) lives in `.data/store.json`.
  Delete that folder any time to reset to a clean seed.

## 2. Manual inputs — do these in order

### 2.1 Replace the placeholder photography
Every product uses picsum.photos placeholders.

- Edit products in `/admin/inventory` → each product's Images section accepts
  image URLs (or the Supabase route later). Aim for 5 shots per piece,
  4:5 ratio, ~1200px wide, WebP/AVIF, every defect photographed.
- Hero image: `src/app/page.tsx` (search `vc-hero`), plus `vc-story`,
  `vc-cat-*` and `vc-about` seeds.
- Your logo is already in `public/logo.png` (shown in the footer).

### 2.2 Legal and trader details
The Terms/Privacy/Cookies pages are templates with sensible placeholder copy —
**review them before launch**. Add:
- Registered trading name and address (footer already has a line for it)
- Company number / VAT number if applicable
- Actual returns address and timeline
- Email privacy/complaints references — the blueprints email list is baked in

Files: `src/app/legal/[slug]/page.tsx`, `src/app/help/[slug]/page.tsx`.

### 2.3 Email addresses
Create these on your domain (Google Workspace/Zoho/etc.):
`henry@`, `hello@`, `orders@`, `support@`, `notifications@vicariousclothing.co.uk`.
`notifications@` is used as the sender for transactional mail.

### 2.4 Real payments (Stripe)
1. Create a Stripe account, stay in **test mode**.
2. Copy your test secret key into `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. For local testing, forward webhooks:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Paste the printed `whsec_...` into `.env` as `STRIPE_WEBHOOK_SECRET`.
4. Checkout now redirects to a real Stripe Checkout page (test cards like
   `4242 4242 4242 4242`). On payment success the webhook marks the order
   PAID and items SOLD. Admin refunds also issue real Stripe refunds.
5. Before launch: switch to live keys, add the production webhook endpoint in
   the Stripe dashboard (`https://vicariousclothing.co.uk/api/webhooks/stripe`,
   event: `checkout.session.completed` + `checkout.session.expired`).

### 2.5 Real email sending (Resend)
1. Sign up at resend.com, verify your domain (DNS records provided by them).
2. Add to `.env`:
   ```
   RESEND_API_KEY=re_...
   ```
3. Emails (order confirmed, dispatched, delivered, refunded, cancelled,
   welcome, sell-to-us enquiry, seller offer) now actually send. They keep
   appearing in `/admin/emails` either way.

### 2.6 Supabase (the real database)
The app currently uses a file-backed store designed 1:1 with the blueprint
data model. To go live you'll want Supabase:

1. Create a project at supabase.com.
2. In the SQL editor, run the whole of `supabase/schema.sql`
   (tables, enums, RLS policies, indexes — mirrors blueprint section 23).
3. Add to `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Replace the internals of `src/lib/server/store.ts` with Supabase queries
   (the function signatures stay the same — every page and API keeps working).
5. Enable Supabase Auth (email/password now; Google/Apple later) and use the
   `profiles.role` column for STAFF/MANAGER/ADMIN/OWNER. The admin gate
   already enforces roles server-side via `src/lib/server/admin-auth.ts` —
   per-user 2FA comes with this step, per blueprint section 24.

### 2.7 Domain & deployment (Vercel)
1. Add `vicariousclothing.co.uk` as a Vercel project domain.
2. In Vercel → Settings → Environment Variables, add every variable from
   `.env.example` (Production AND Preview, using Stripe **test** keys for
   previews — blueprint section 32).
3. Deploy `main`. Preview deployments come free with each push.
4. Point DNS to Vercel; set up SPF/DKIM/DMARC for the email domain.

### 2.8 Real inventory & data
- Delete `.data/store.json` to clear demo products/orders, then add real stock
  through `/admin/inventory` → Add product (the sectioned workflow with
  economics calculator).
- Marketplace channels (Vinted/Depop/eBay) are tracked per product at
  `/admin/marketplace` — keep that page open while listing elsewhere; the
  "Sold on …" buttons delist from the website instantly.
- Discount codes: `/admin/discounts` (percentage, fixed, free delivery,
  category-only, min basket, expiry, usage limits, one-per-email).

### 2.9 Analytics
`/admin/analytics` is live: revenue, net profit (uses your cost prices),
orders, items sold, average order, conversion (orders ÷ tracked visits),
return rate, average days-to-sell, channel split, 30-day chart, top brands.
Visits are counted once per browser session — good enough to steer on;
replace with PostHog/GA when you want real product analytics.

## 3. Launch checklist (blueprint sections 32–34)

- [ ] All content pages reviewed (legal especially)
- [ ] Real photography on every product; alt text written
- [ ] Stripe live keys + production webhook; test mode until the moment of launch
- [ ] Resend domain verified; test each transactional email template
- [ ] Supabase project live, `schema.sql` run, backup schedule on (inventory,
      orders, acquisition records, financials, images — blueprint section 33)
- [ ] `.env` secrets only in Vercel, never committed; 2FA on Vercel/Stripe/
      Supabase/domain accounts
- [ ] `ADMIN_PASSWORD` changed from the example value
- [ ] Domain + email DNS (SPF/DKIM/DMARC)
- [ ] Cookie consent wording matches what you actually run
- [ ] `robots`/sitemap unblocked and Open Graph images set for social sharing

## 4. What stays manual by design (later phases)

| Blueprint phase | Feature | Status |
| --- | --- | --- |
| 3 | Customer accounts with real auth | Demo browser accounts; Supabase Auth is the swap |
| 3 | Email marketing broadcasts | Transactional only; connect a provider |
| 4 | Automated marketplace delisting | Manual status layer (per blueprint: platform rules vary) |
| 4 | Seller payments workflow | Lead pipeline exists; payment on ACCEPTED is manual |
| 5 | Vinted/eBay API integrations | Only when Phase 2 is bulletproof (build discipline) |
| 6 | EPOS / barcodes / click & collect | Physical retail phase |

## 5. File map (where everything lives)

```
src/lib/types.ts              The data model (mirrors blueprint section 23)
src/lib/server/store.ts       Store + reservation + discounts + orders
src/lib/server/mailer.ts      Email templates + provider adapter
src/lib/server/payments.ts    Stripe client
src/lib/server/admin-auth.ts  Roles + admin gate
src/lib/catalog.ts            Search, filters, facets, similar products
src/app/api/*                 Checkout, webhooks, orders, discounts, leads…
src/app/admin/*               Dashboard, inventory, orders, leads, discounts,
                              marketplace, analytics, emails
supabase/schema.sql           Full production database schema + RLS
.env.example                  Every supported environment variable
```
