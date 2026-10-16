# Release 7 — phase 2: Inventory and orders

Preserves existing Vicarious Clothing branding and the React / Supabase / SellerHQ business logic.

## Inventory
- Count summaries for Available, Draft, Reserved, Sold, and Archived statuses, with deep links.
- Existing search (SKU, SellerHQ PRD code, name, brand, location) and status filters retained and given a clear reset action.
- Product names now go to the admin product editor rather than the customer storefront.
- Missing product images display a neutral placeholder rather than attempting to load an empty URL.
- Existing stock actions and SellerHQ sync controls remain in place.

## Orders
- Quick filters for all orders, fulfilment (Paid / Picking / Ready to dispatch), returns (Return requested / Returned), and pending payment.
- Search by order reference, customer, email address or purchased item name.
- Specific status dropdown, clear filters, and manage links to order details.
- Existing order-management logic, payment and SellerHQ integration remain unchanged.

## Acceptance checklist
1. Verify `next build` / lint on active Vercel deployment.
2. Test inventory status links, query matching, missing-image placeholder and product editing links.
3. Test all order workflow queues and combined query/status filters, including unknown status parameters.
4. Verify mobile horizontal table scroll and keyboard navigation.
5. Validate role-based page access against direct URL navigation and API endpoints.
6. Confirm no stock mutations, payment changes or SellerHQ resync occur simply by viewing/filtering pages.

No database migrations, maintenance-mode changes, or cron changes.
