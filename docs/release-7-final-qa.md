# Release 7 — Final integration and QA review (2026-10-16)

## Fixes committed
- Added explicit role gates before rendering /admin/inventory/new (MANAGER), /admin/orders/[id] (ADMIN), and /admin/maintenance (OWNER). Previously only the parent authenticated admin layout was checked.
- Adjusted /admin/operations to hide financial acquisition data, order queues and SellerHQ admin reporting from MANAGER-level users without ADMIN access.
- Reviewed the recent Release 7 navigation, inventory, orders, Sell To Us, purchases, finance, marketing, staff management and settings components against the available repository code.

## Verification evidence
- GitHub Vercel commit status for commit fbfcea83: PENDING at review time; not a passing build.
- No verified local clone/install available through connector session, so npm run lint, npm run build and npm test have NOT been executed in this review.
- No production browser access to the deployment, so mobile rendering, MFA navigation, integration actions and permissions have NOT been end-to-end tested.

## Release acceptance still needed
1. Verify Vercel deployment is green and review TypeScript / Next.js compilation output.
2. Run npm run lint, npm run build, npm test.
3. Test direct page and API access under STAFF, MANAGER, ADMIN, OWNER and SUPER_ADMIN accounts; disabled staff account and signed-out state.
4. Walk through navbar on 320px mobile, tablet and desktop widths, including overlapping storefront chrome.
5. Exercise catalogue and order filters, lead status changes, acquisitions, discounts, subscriber consent, role editor and SellerHQ health.
6. Confirm payment and refund metrics against Stripe, including partial refunds and date boundary/timezone handling.
7. Test that the last Super-admin cannot be removed in concurrent requests; consider transactional constraint when multiple Super-admin accounts exist.
8. Review sensitive nested routes and server-side actions; UI link hiding is never an authorization boundary.

## Operational non-changes
Maintenance mode, Stripe payment flow, SellerHQ retry scheduling (daily) and storefront were not deliberately modified.
