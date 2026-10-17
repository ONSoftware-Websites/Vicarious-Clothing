# Release 11 — Finance and Business Intelligence

Implementation branch: `feature/release-11-finance-intelligence`.
Production branch `master` not modified as part of development.

## Scope implemented

### Restricted finance ledger
- `finance_adjustments` stores fee, refund, shipping, packaging, operating-expense and debit-correction entries in GBP.
- Unique kind/reference prevents duplicate imported Stripe records or repeated manual references.
- Each entry includes the transaction date, reference, optional order, notes and responsible staff account.
- Row-level security on; anonymous and ordinary authenticated roles have no direct table permissions; server role has only select and insert.
- POST `/api/admin/finance` validates type, value in pennies, date and existing order association. Requires ADMIN with MFA via existing authorization.
- Staff may not delete or silently edit these append-only financial records through the admin UI.

### Reporting
- `/admin/finance`: gross non-pending/non-cancelled order totals, known sold stock acquisition costs, recorded fees/refunds/expenses, and **estimated contribution**.
- Acquisition basis prefers the cost allocated in paid stock purchases, falling back to product-record costs; missing cost count is highlighted.
- Fully refunded orders lacking an actual recorded refund adjustment generate a reconciliation warning.
- Channel sales and order-linked deductions are shown separately from unattributed overheads.
- Discount-code attribution shows order totals and applied discounts per code, not causally proven campaign uplift.
- Monthly gross order totals and recorded deductions appear by their respective transaction periods.
- Finance records are paginated in batches with an explicit capacity limit and fail closed on incomplete reads.
- Export endpoint `/api/admin/finance/export` produces a server-authenticated CSV of all supported adjustment records, with CSV formula injection protection.

### Stripe reconciliation
- `/api/admin/finance/reconcile-stripe` is a manual, role-guarded operation per Stripe order.
- Verifies the PaymentIntent belongs to that order, is GBP and has matching metadata.
- Retrieves captured-charge balance-transaction fees and successful Stripe refunds.
- Adds uniquely referenced financial adjustments idempotently; never initiates refunds or additional charges.
- Existing manual refunds for the same order block Stripe refund import to avoid double-counting. Staff must resolve historical manual entries separately.
- API rejects paginated Stripe lists that exceed the supported single-run limit, rather than silently showing incomplete data.

### Tests and safety
- `src/lib/finance-report.test.ts` covers gross totals, cost fallback/preference, refunds, missing costs, channel, campaign and month attribution.
- Database migration `supabase/release-11-finance-adjustments.sql` applied successfully to the linked Supabase project.
- Read/write permission smoke test: anon SELECT denied; authenticated INSERT denied; service SELECT allowed; RLS enabled; zero duplicate ledger references.
- Supabase security advisor shows only expected informational RLS-no-policy results and the existing unrelated leaked-password-protection warning.
- No changes to Stripe charging or refunds, SellerHQ, daily cron schedule, storefront maintenance or existing admin roles.

## Limitations and acceptance checks
- Financial records initially have **zero** manual/reconciled entries. Backfill actual fee/refund/expense transactions before trusting profitability.
- The result is an operational contribution estimate, NOT a statutory P&L, VAT return, or complete statement of bank settlement/cash flows.
- Historical cancelled-but-paid orders and partial refund timing require reconciliation against source transactions.
- Returns that restock products may require COGS adjustments not modelled in this initial ledger.
- Campaign attribution relies on discount codes, not verified conversion lift or email click attribution.
- No Stripe secrets displayed or written to clients. Only successful Stripe refund transactions import.
- **Not executed in this connector session:** `npm run lint`, `npm test`, `npm run build`, mobile/UI test, payment-provider sandbox acceptance.
- Test Stripe fee + refund reconciliation with no records, repeated imports, manually recorded refund conflict, GBP-mismatched payment and non-Stripe order.
- Check ledger entries across STAFF/MANAGER/ADMIN/OWNER/SUPER_ADMIN accounts.
- Check large ledger paging and CSV formula injection, then verify reports against actual business accounts.

## Deployment
Keep release in a draft pull request and merge once after acceptance, following the agreed one-production-deployment-per-major-release approach.
