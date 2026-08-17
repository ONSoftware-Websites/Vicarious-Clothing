# Deploying to Vercel

Everything needed to deploy is already in the repo (`vercel.json`, build
scripts, environment template). This guide walks through it once.

---

## 1. Push the repo to GitHub (once)

Vercel deploys from Git. If you don't have a remote yet:

```bash
git add .
git commit -m "Vicarious Clothing — initial storefront, admin, commerce"
git remote add origin https://github.com/<you>/vicarious-clothing.git
git push -u origin main
```

Never commit `.env` — it's already gitignored (`.env.example` is the
template that ships).

## 2. Import into Vercel

1. Go to https://vercel.com/new → **Import** the repo.
2. Vercel auto-detects Next.js:
   - Framework preset: **Next.js**
   - Build command: `npm run build` (default)
   - Output directory: default
   - Node version: 22.x (or leave auto — `engines` in package.json asks for >=20.9)
3. Click **Deploy**. You now have a working preview on `*.vercel.app`.

## 3. Environment variables

Project Settings → Environment Variables. Add these for **Production**
(and **Preview** with test keys):

| Variable | Value | Required? |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Your admin password (change from the example!) | Yes — otherwise `/admin` is open |
| `NEXT_PUBLIC_SITE_URL` | `https://vicariousclothing.co.uk` (or the `.vercel.app` URL while testing) | Recommended — drives sitemap/robots/OG/email links |
| `STRIPE_SECRET_KEY` | `sk_test_…` in Preview, `sk_live_…` in Production | No — blank = demo checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from Stripe (see below) | Only with Stripe |
| `RESEND_API_KEY` | `re_…` | No — blank = emails logged, not sent |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Only for the Supabase swap-in |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Only for the Supabase swap-in |

**Important about the demo data store:** on Vercel the filesystem is
read-only, so the file-backed store automatically switches to in-memory
mode. That means the site works fully for previewing, but data resets on
redeploys/cold starts, is **not shared across serverless instances**, and
admin edits may not show on storefront pages (each instance keeps its own
copy). That's fine for previewing — **production data belongs in Supabase**
(run `supabase/schema.sql`, set the two variables, and swap the internals
of `src/lib/server/store.ts`, keeping the same function signatures).
Locally and on a single-server host, the file store is fully consistent —
every read re-syncs from disk.

## 4. Stripe webhook (only when using Stripe)

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://vicariousclothing.co.uk/api/webhooks/stripe`
   (or your `.vercel.app` URL while testing).
3. Events to send: `checkout.session.completed`,
   `checkout.session.expired`.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.
5. For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Checkout only works when `NEXT_PUBLIC_SITE_URL` (or the request origin)
matches the domain Stripe redirects back to — Stripe Checkout handles
this via the `success_url`/`cancel_url` built from the request origin.

## 5. Domain

1. Project Settings → Domains → add `vicariousclothing.co.uk`.
2. Follow Vercel's DNS instructions at your registrar (CNAME to
   `cname.vercel-dns.com` or A record to `76.76.21.21`).
3. Vercel issues SSL automatically. Set
   `NEXT_PUBLIC_SITE_URL=https://vicariousclothing.co.uk` and redeploy.
4. Email DNS (SPF/DKIM/DMARC) is separate — follow Resend's domain
   verification and Google Workspace/Zoho instructions.

## 6. Post-deploy checks

- [ ] `/` renders, images load (picsum is allowed in `next.config.ts`)
- [ ] `/shop`, `/product/…`, `/sitemap.xml`, `/robots.txt` return 200
- [ ] `/admin` asks for the password; login works over HTTPS
- [ ] Place a test order (Stripe test card `4242 4242 4242 4242` if
      Stripe is on, otherwise demo mode)
- [ ] `/admin/emails` shows the confirmation email; Resend delivers it
- [ ] `https://vicariousclothing.co.uk/opengraph-image` shows the brand
      image (paste a product URL into https://www.opengraph.xyz or
      LinkedIn's post inspector)

## 7. Day-to-day

- Every push to `main` = Production deployment; every branch = Preview
  with its own URL (great for checking changes before merge).
- Run the test suite before pushing: `npm test` (reservation rules,
  discount validation, order flow, catalog logic).
- Revert anything: Project → Deployments → ⋯ → Rollback.
- Logs: Project → Logs (runtime), Build logs on each deployment.
- The `vercel.json` in this repo already sets security headers
  (nosniff, frame-deny, referrer policy, permissions policy, HSTS).

## 8. Staging pattern (recommended)

1. Push to `main` → production deploy.
2. Create a `preview` Git branch with Stripe **test** keys in the
   Preview environment → a permanent staging URL for trying changes
   against real payment UI without touching live money.
3. Keep `ADMIN_PASSWORD` distinct between environments.
