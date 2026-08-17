# Vicarious Clothing

Independent pre-owned clothing ecommerce platform, built from the
*Vicarious Clothing Website Design & Development Blueprint v1.0 (Aug 2026)*.

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. The data layer is
structured for Supabase and the payment step is structured for Stripe —
both swap in without rework.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Admin area: `/admin` (password from `.env` — see `.env.example`).

> **Making it live:** real payments, email sending, the Supabase database,
> domain setup and the launch checklist are all covered step by step in
> [SETUP.md](./SETUP.md).
>
> **Deploying:** the repo is Vercel-ready (`vercel.json`, sitemap, robots,
> Open Graph, serverless-safe data layer). Follow [DEPLOY.md](./DEPLOY.md).

## What's implemented

### Customer site (Phase 1 + 2)

| Blueprint section | Status |
| --- | --- |
| Homepage (hero, new in, picks, category tiles, brand story, recently sold, newsletter) | Done |
| Shop with filters (brand / size / condition / colour / price) and sort | Done |
| Category pages (`/shop/jackets`, `/shop/new-in`, `/shop/sale`) | Done |
| Product detail (gallery, zoom/fullscreen, condition, measurements, accordions, sold state) | Done |
| Brands directory + `/brands/carhartt` landing pages | Done |
| Search (overlay with trending, `/search?q=`) | Done |
| Bag (slide-out drawer + `/bag` route) | Done |
| Checkout: Contact → Delivery → Payment → Review → Confirmation, guest-first | Done (Stripe when keys are set, demo mode otherwise) |
| Inventory reservation: AVAILABLE → RESERVED → SOLD with 30 min expiry and race protection | Done |
| Discounts: percentage, fixed, free-delivery, category-only, min basket, expiry, usage limits | Done (`/admin/discounts`) |
| Transactional email: order confirmed/dispatched/delivered/refunded/cancelled, welcome, sell-to-us enquiry + offer | Done (Resend when key set, file log otherwise — `/admin/emails`) |
| Accounts (profile, orders, addresses, wishlist, preferences) | Done (browser demo auth) |
| Wishlist with sold-item handling | Done |
| Sell To Us form → lead pipeline (NEW → REVIEWING → … → PAID) | Done |
| Journal: storefront listing + article pages, admin editor | Done (`/journal`, `/admin/journal`) |
| Newsletter capture with consent records, admin list + CSV export | Done (`/admin/newsletter`) |
| Help & legal pages (delivery, returns, FAQs, size guide, condition guide, terms, privacy, cookies) | Done |
| Cookie consent: Accept all / Reject optional / Manage | Done |
| Branded error states (404, just-sold, empty bag, no results) | Done |
| SEO: metadata, Open Graph, JSON-LD product schema, sold URLs preserved | Done |

### Admin (Phase 1 + 2 + early 4)

| Feature | Where |
| --- | --- |
| Dashboard (orders/revenue today, awaiting dispatch, enquiries, inventory counts, aged stock) | `/admin` |
| Inventory table with search + status filter | `/admin/inventory` |
| Product workflow: Identity, Product, Measurements (category-aware), Acquisition, Selling, Images, Storage, Description | `/admin/inventory/new`, `/admin/inventory/[sku]` |
| Save Draft / Publish | Product form |
| Item economics (cost, fee estimate, packaging, est. profit/margin) | Product form sidebar |
| Actions: edit, duplicate, mark sold, archive, relist, discount, print label | Inventory table |
| Orders with status flow (PAID → PICKING → READY TO DISPATCH → DISPATCHED → DELIVERED) + branches (returns, refund, cancel) | `/admin/orders` |
| Tracking entry | Order detail |
| Sell To Us lead pipeline | `/admin/leads` |
| Stock purchases: sellers, agreed amounts, item costs, paid status; accepted leads record purchases automatically | `/admin/purchases` |
| Discounts: types, rules, usage, pause/delete | `/admin/discounts` |
| Marketplace status layer (list/delist per channel, sold-elsewhere) | `/admin/marketplace` |
| Analytics: revenue, net profit, conversion, return rate, days-to-sell, channel split | `/admin/analytics` |
| Transactional email log (sent or written to file) | `/admin/emails` |
| Newsletter subscribers with consent records + CSV export | `/admin/newsletter` |
| Journal editor (draft/publish) | `/admin/journal` |
| Per-item history (every change to a SKU) | product edit page |
| Audit log (actor, action, before/after, timestamp) | `/admin` |

## Architecture

```
Next.js (App Router)
 ├─ Storefront pages (server components)
 ├─ Admin area (server + client)
 └─ API routes (orders, reservation, search, admin mutations)
Data layer: src/lib/server/store.ts
 ├─ File-backed JSON store (.data/store.json, gitignored)
 └─ Designed 1:1 with the blueprint data model so Supabase can replace it
```

Key behaviour:

- **Product vs inventory item** — a `Product` is the physical unit Henry owns
  (cost, condition, location, availability), matching blueprint section 23.
- **Authoritative inventory** — availability is checked server-side at order
  creation. Checkout reserves items for 30 minutes; abandoned carts release
  them lazily. A second buyer hitting a sold item gets a 409 and the
  "SOMEONE GOT THERE FIRST" state.
- **Sold products keep their URLs** — sold pages show "THIS ONE'S GONE" and
  link similar live pieces (blueprint section 28).
- **Client state** (cart, wishlist, demo account, addresses, consent) uses
  `useSyncExternalStore` over localStorage and survives refresh.

## Swap points (already adapter-ready)

- **Stripe** — fully wired: set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
  and checkout redirects to Stripe Checkout, with payment-success webhooks and
  admin refunds. Without keys, checkout runs in demo mode (no payment taken).
- **Transactional email (Resend)** — fully wired: set `RESEND_API_KEY` and
  emails send from `notifications@vicariousclothing.co.uk`. Without a key,
  every email is written as HTML in `.data/emails/` and logged in
  `/admin/emails`.
- **Supabase** — run `supabase/schema.sql` in a new project, set
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then replace
  the internals of `src/lib/server/store.ts` (same function signatures).
  Supabase Auth replaces the demo account, and `profiles.role` gives you the
  STAFF/MANAGER/ADMIN/OWNER roles from blueprint section 24.
- **Real photography** — swap product image URLs in `.data/store.json` (or
  the Supabase seed) with studio shots, ideally WebP/AVIF.

## Routes

```
/                          Home
/shop                      All clothing (filters via query params)
/shop/[category]           tops, hoodies, knitwear, jackets, trousers,
                           jeans, footwear, accessories, vintage, new-in, sale
/brands · /brands/[brand]  Brands directory
/product/[slug]            Product detail (sold-safe)
/search                    Search results
/bag · /checkout           Bag and guest checkout
/order/[id]                Order confirmation / view order
/account · /account/*      Profile, orders, addresses, wishlist, preferences
/sell-to-us                Acquisition form
/journal · /journal/[slug] Journal articles
/about                     Brand story
/help/*                    Contact, delivery, returns, FAQs, size guide, condition guide
/legal/*                   Terms, privacy, cookies
/admin · /admin/*          Dashboard, inventory, orders, leads, purchases, discounts,
                           marketplace, analytics, emails, newsletter, journal
```

## Tests

```bash
npm test       # vitest — reservation, discount rules, orders, catalog logic
```

## Scripts

```bash
npm run dev     # develop
npm run build   # production build
npm run lint    # eslint
npm run test    # vitest
npm run start   # serve production build
```
