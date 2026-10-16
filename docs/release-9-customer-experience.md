# Release 9 — Customer shopping experience

**Implementation branch:** `feature/release-9-customer-experience`
**Production branch:** `master` unchanged. Stage all work here; merge once, at the final approved release deployment.

## Delivered
### Catalogue and discovery
- Shared `isPublicProduct` across search, product query and shop results. Archived/draft stock is excluded consistently.
- Multi-term matching of search fields and more relevant ordering in instant search.
- Search error recovery and safe missing-image fallback.
- Shop pagination (24 per page) with active filters and sort retained in the URL; clear empty-result CTA.
- Consistent query matching on shop/search pages; similarity ranks by category, brand, size and price.
- Sort changes reset page number; malformed sort falls back to newest; price inputs validate ranges and reset pagination.
- Filter drawer handles Escape, focus return and background scroll locking.

### Product presentation
- Visible known-defect disclosure before add-to-bag, plus condition/delivery/returns links.
- Correct wording when garment measurements are unrecorded; no unsupported “one size fits most” assertion.
- Improved lightbox focus management and image position announcement.

### Wishlist and basket
- Remote wishlist sync failures now show a user-facing error; Release 8 atomic sync is preserved.
- Basket storage normalisation deduplicates one-of-one SKUs.
- Basket and drawer fetches handle missing stock and failed API responses without infinite loading.
- Unavailable garments disable checkout; missing SKUs can be removed; missing images use a safe fallback.
- Bag drawer directs unavailable-stock cases to full bag review.

### Checkout
- Stock lookup failures and missing items produce recoverable error screens rather than infinite loading.
- Customer checkout permits its own reserved items, relying on server-side hold validation.
- Payment config failures no longer silently show demo payment UX.
- Contact details and delivery preferences are restored in session storage for up to two hours. No card numbers, CVC, payment tokens or client secrets stored there.
- Checkout success clears the tab-scoped draft for both Stripe and demo paths.
- Improved email/contact validation, step announcements and alerts.
- Corrected free-delivery coupon saving display.

## Compatibility commitments
- Vicarious branding retained.
- Stripe and checkout inventory reservations remain server-authoritative.
- No database migration, change to maintenance mode, Cron frequency, Stripe configuration or admin roles.
- No intentional production deployment; merge to master only after accepting this release.

## Tests and acceptance
Added unit tests: `src/lib/public-catalog.test.ts` and enhanced `tests/catalog.test.ts`.

**Not yet executed in this connector session:** npm run lint, npm test, npm run build, preview/production browser tests. Repository is private and not accessible by container for local install; GitHub connector supports reading/writing only. Vercel production build had been limited. Do not claim success without a green build.

**Manual acceptance cases:**
1. Search multiword brands, names, categories, no-match, unavailable stock and API failure.
2. Filter then sort then page 2; change a filter and verify page resets.
3. Check product measurements/defects; keyboard gallery and filter dialogs.
4. Sign in and sign out with wishlist selections; force RPC failure and ensure visible feedback and no lost local items.
5. Add unique stock to bag; mark it sold and refresh; remove missing SKUs; check drawer and checkout are blocked.
6. Checkout via Stripe with normal, declined, 3DS, interrupted and refreshed sessions; verify confirmation only on successful payment.
7. Confirm payment draft contains no card information and is cleared on success.
8. Check responsive mobile at 320px, tablet and desktop, and screen-reader focus.

## Deployment policy
Changes were developed on a dedicated non-production branch. Vercel may still automatically build preview branches depending on project configuration. Avoid production deployment per individual commit. Merge in one action when deployment capacity and acceptance tests allow.
