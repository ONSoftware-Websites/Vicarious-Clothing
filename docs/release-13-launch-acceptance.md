# Release 13 — Launch Optimisation and Production Acceptance

Development branch: `feature/release-13-launch-optimisation`.
Production branch: `master` unchanged until an explicitly requested release merge.

## Implemented

### Discovery SEO and social cards
- Sitemap excludes drafts, archived and sold product URLs and unpublished journal posts.
- Search is set to `noindex`, and `robots.txt` discourages crawling of internal authentication, checkout, order and API routes.
- Individual product pages provide self-canonical metadata and mark reserved/sold listings as non-indexable.
- Shop and category pages canonicalise to the unfiltered page, avoiding duplicate search entries from query parameters.
- Brand-level Open Graph and Twitter card defaults added; per-product descriptions and image metadata retained.
- Do not place a canonical URL for `/` in the root shared layout because it would incorrectly canonicalise all other routes.

### Browser and accessibility improvements
- Added a keyboard-accessible “Skip to main content” link and focusable main landmark on the storefront.
- Added non-disruptive headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, restricted camera/microphone/geolocation `Permissions-Policy`.
- Existing reduced-motion CSS, responsive images, lazy loading and high-priority hero asset preserved. No billable new image-transformation service.
- Existing one-of-one stock reservation and checkout service unchanged.

### Launch readiness
- Owner-only admin route `/admin/launch-readiness`, linked in sidebar/settings.
- Pure configuration checks for HTTPS canonical URL and presence of key server integrations; never reveals values.
- Basic Vitest checks cover missing config, HTTPS validity and absence of secret values in output.
- Readiness view explicitly distinguishes presence/configuration from successful integration tests.
- Existing maintenance mode remains unchanged.

## Production acceptance checklist (not performed by creating this branch)

- [ ] `npm run lint` succeeds
- [ ] `npm test` succeeds
- [ ] `npm run build` succeeds
- [ ] Vercel reports green production or release-preview build
- [ ] Manual keyboard and screen-reader audit: skip link, navigation, menu overlays, modal focus, checkout errors and labels
- [ ] Mobile visual audit at narrow viewport, tablet and desktop
- [ ] Lighthouse accessibility/SEO/performance checks on real production pages, including homepage, category and product
- [ ] Product JSON-LD validated with current Google Rich Results Test; confirm sold/reserved availability annotations
- [ ] Verify sitemap only contains live public categories, available stock and published journal entries; check robots and canonical headers
- [ ] Stripe test purchases: valid, declined, interrupted, abandoned and refundable payments; no double-sold stock
- [ ] Seller submissions, offer acceptance, inspections, purchased stock and refunds checked end-to-end
- [ ] Resend transaction accepted, delivered and bounce flows verified with provider logs
- [ ] SellerHQ bidirectional integration, dead-letter recovery and daily job reviewed
- [ ] Legal review of Terms, Privacy, Cookies, Delivery, Returns and Sell To Us policies against current operations and UK legal obligations; obtain independent review as appropriate
- [ ] Confirm live support email, contact details, address, company/legal identity, and available shipping services
- [ ] Verify domain, HTTPS certificate, webhook origins, email SPF/DKIM/DMARC and secrets rotation policy
- [ ] Confirm error monitoring, backups, recovery runbook and rollback to previous Vercel deployment
- [ ] Explicitly approve taking the storefront out of maintenance mode; no automatic mode switch in this release

## Important limits

No network-based Lighthouse, actual browser verification, complete `npm` build, live payment testing or legal compliance certification was performed via GitHub-only connector. These should not be claimed as passed.

This release does not add third-party analytics tracking or weaken cookie consent; any new analytics SDK requires prior consent and privacy review.

No new Vercel cron, Stripe charges, SellerHQ sync tasks, customer emails, database schema changes or maintenance switches were introduced.

## Deployment discipline

Use one draft PR and a single final squash merge when approved. Avoid treating preview status or source-code review as proof of a successful production deployment.
