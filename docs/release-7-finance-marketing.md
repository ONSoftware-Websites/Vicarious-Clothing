# Release 7 — Phase 4: Finance & Analytics and Marketing

## Finance & Analytics
- Existing charts, sales channels, revenue and product-economics estimates remain in place.
- Added stock acquisition capital snapshot (available/reserved inventory cost), pending-payment and refunded-order counts, website revenue share and direct reconciliation links.
- Explicit clarification: product-based profit is an estimate, not a complete accounting statement; partial refunds require more detailed reconciliation.

## Marketing
- New /admin/marketing landing page with role-aware shortcuts to newsletter, discount codes and email activity.
- Discount management now shows code count, expirations, exhausted usage limits and recorded redemption totals, with collapsible creation form.
- Newsletter shows total consented subscribers and search of the subscriber table without changing campaign recipient count.
- Transactional emails now show latest-100 status summary and search/filter controls.
- Sidebar business navigation links to unified Marketing workspace. Existing deep links remain valid.

## Acceptance
- Verify TypeScript / lint / build and mobile layouts.
- Check discount expiry boundaries and exhausted usage limits.
- Verify newsletter count and send consent restrictions, and that filtering does not change recipients.
- Verify email provider statuses; 'sent' does not guarantee final delivery.
- Check role enforcement for direct URLs and underlying action APIs.
- Reconcile finance totals against known paid, refunded, partially refunded and multi-channel transactions.
- Review time zone treatment in analytics for BST and GMT.

No intended changes to database, maintenance mode, storefront, cron schedule, SellerHQ syncing or Stripe processing.
