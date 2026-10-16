# Release 7 — Phase 3: Sell To Us and Purchasing

This phase updates the administrative workflow interfaces while preserving existing site branding and existing persistence/API actions.

## Sell To Us
- Status pipeline summary: New, Under Review, Accepted/Inbound, Completed.
- Filter by exact status and search seller, email, brand, item type, size or condition.
- Preserve existing offer and status controls, lead deletion, secure signed lead-photo links and contact mailto.
- Show the stages of the acquisition process on the page.
- Existing backend behaviour when a lead is accepted remains unchanged.

## Purchases
- Acquisition counts, total paid amount, outstanding balances and unlinked stock counts.
- Search seller, email, item SKU, item name and notes.
- Paid/outstanding payment filters.
- Collapsible stock purchase creation form to prioritize reconciliation.
- Existing purchase payment actions, deletion controls, and ledger integration remain unchanged.

## Verification
- Confirm build, lint and TypeScript compile.
- Test leads with private photos and without photos, signed URL expiry, empty notes, status transitions and offer values.
- Test all lead status filters plus mixed search/status.
- Verify accepted leads propagate into purchases via existing behaviour without duplicate entries.
- Test purchase paid/unpaid transitions, duplicate-click safeguards, seller records without items, totals and purchase creation form.
- Verify role access to both pages and underlying APIs.
- Validate horizontal scrolling and form usability on mobile.

No database migration, SellerHQ webhook changes, cron changes or maintenance mode changes.
