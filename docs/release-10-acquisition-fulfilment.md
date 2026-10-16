# Release 10 — Acquisition & fulfilment automation

**Branch:** `feature/release-10-acquisition-fulfilment` (based on `master`).
**Production deployment:** NOT requested / not merged as part of this implementation.

## Seller acquisition
- Dedicated seller case detail screen at `/admin/leads/[id]`, with confidential photo preview, seller/contact and condition details, current offer, linked purchase, and operation journal.
- Seller status dropdown exposes only valid next stages. Server also rejects invalid transitions.
- Receipt → inspection requires a recorded latest completed inspection checklist.
- Linked accepted-lead purchases are displayed. ADMIN or higher can link an existing inventory SKU and allocated acquisition cost.
- Linking rejects missing inventory, sold/archived inventory, duplicates within a purchase, and total allocations that exceed the acquisition amount.
- A payment record can only be marked paid through the service-role atomic `confirm_stock_purchase_payment` RPC. For Sell To Us leads, it requires Inspected status, completed inspection + intake checks and at least one linked purchased item. It atomically marks the purchase Paid, links the lead status to Paid and stores an external payment reference and audit note.
- A confirmation dialog makes clear that recording payment does **not** actually transfer funds.

## Fulfilment & dispatch
- Order detail screen has an auditable packing checklist and operational notes. All entries are staff-attributed.
- Shared state machine requires Paid → Picking → Ready to dispatch → Dispatched → Delivered. Tracking and a complete packing checklist are required to dispatch.
- Existing Stripe refund logic retained; admin UI requests confirmation before refund.
- Order status updates now use compare-and-set against the previously observed order status to reduce concurrent-staff status conflicts.
- Operations centre highlights outstanding fulfilment, return requests, seller inspections, and acquisitions without linked stock.

## Customer returns
- Authenticated customers with the original order email, and guest buyers with existing signed order access, can request returns on dispatched/delivered orders.
- Restricted `create_customer_return_request` RPC atomically records the return request and puts the order in `RETURN_REQUESTED`.
- Customers see return-request confirmation on the order detail page.
- Admin return checklist covers reviewing the request, receiving the garment and checking its condition, and is required before marking Returned.
- No automatic refund or restock is triggered by merely requesting a return.

## Database migrations already applied to the linked Supabase project
1. `supabase/release-10-workflow-records.sql` — protected staff operational logs.
2. `supabase/release-10-customer-returns.sql` — transactional customer return intake.
3. `supabase/release-10-acquisition-item-uniqueness.sql` — unique SKU per stock purchase.
4. `supabase/release-10-purchase-payment.sql` — externally confirmed purchase payment reconciliation.

All new sensitive SQL functions have `EXECUTE` revoked from `PUBLIC`, `anon`, and `authenticated`, while allowing `service_role`. The workflow_records table has RLS enabled and no public read/write privileges.

## Verification completed
- The four SQL migrations applied successfully.
- Nonexistent-order return and nonexistent-purchase payment smoke tests returned false without changing records.
- Server service-role execution permitted; anon/authenticated execution denied for both privileged functions.
- No duplicate purchase-item SKU links found.
- Supabase security advisor continues to report only expected informational no-policy entries and the existing leaked-password-protection warning. No new public privileged-function exposure was detected.
- Branch diff compared with master: 27 modified/new files at review time.
- Added unit tests for order and seller state-machine transitions and required checklist keys.

## Deployment/acceptance still required
- Execute `npm run lint`, `npm test` and `npm run build` after obtaining a runnable local checkout or successful CI environment.
- Browser test STAFF, MANAGER, ADMIN, OWNER and SUPER_ADMIN role access to seller/order pages and APIs.
- Test seller lead acceptance, private photo preview, inspection/intake evidence, inventory linkage, and payment reconciliation against a test record.
- Test real customer and guest return requests, repeated submissions, status conflicts, and manual refund behavior in Stripe test mode.
- Test order dispatch workflow with tracking, incomplete/complete packing checklist, emails and SellerHQ sync.
- Test mobile responsiveness and accessibility (form focus, keyboard, checklist and alert states).
- Confirm production preview availability before merging. GitHub-only code commits on the feature branch do not intentionally modify `master`.

## Known limitations
- Shipping labels and automatic carrier delivery events require live carrier credentials/provider integration, which are not configured by these changes.
- Seller payouts are **recorded** only; no bank payout is executed.
- Return approval remains a manual staff decision; no automatic Stripe refund is made from the customer form.
- A public returns deadline cannot be calculated accurately without a verified delivered-at timestamp; eligibility should be reviewed under the business's returns policy.
- Product/marketplace external sync remains governed by existing SellerHQ integrations.

No intentional changes to maintenance mode, Vercel daily cron, Stripe secret settings or customer payment collection.
