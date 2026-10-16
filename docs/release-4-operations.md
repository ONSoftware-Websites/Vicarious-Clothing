# Release 4 — Operations and customer experience

## Implemented
- `/admin/operations` provides a work queue covering paid orders awaiting fulfilment, seller enquiries, outstanding stock-purchase payments, listing image gaps, invalid pricing, and SellerHQ retry jobs.
- Operations navigation added to the existing admin layout.
- SellerHQ product imports now reject unmapped categories and conditions instead of silently assuming `vintage` or `good`. Update SellerHQ mappings deliberately when introducing new taxonomy values.
- Analytics now avoids dividing average order value by the wrong denominator and includes refunded orders in the return-related calculation.

## Existing functions retained (not rebuilt)
- Inventory search and status filters, SellerHQ PRD codes, bulk sync actions, purchase register, lead-status changes, product editing, storefront shop filters, and sales analytics.

## Verification required before release
- Test the operations page with realistic orders, leads and failed SellerHQ jobs.
- Review category and condition values sent by SellerHQ. Import failures are intentional for unknown values until mappings are defined.
- Test public storefront filtering, mobile navigation, accessible checkout and product photographs manually.
- Audit analytics definitions with real orders, especially partial refunds and return-requested states.
- Revisit Release 3 owner enrolment and enable `ADMIN_AUTH_V2` only after full MFA testing.
- Run build, lint and unit tests in CI/working checkout.
- Maintain storefront maintenance mode until previous release acceptance tests have passed.

Release 4 currently improves core operations but is not a comprehensive reimplementation of catalogue, consignment and customer account UX.
