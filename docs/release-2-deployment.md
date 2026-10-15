# Release 2 deployment checklist

Release 2 is NOT active until its database migration is applied and the application is deployed and tested.

1. Apply `supabase/repair-2026-10-16-release-2.sql` to Vicarious Clothing Supabase project.
2. Deploy the updated application with maintenance mode still enabled.
3. Test two concurrent SellerHQ order event submissions; verify one event key is stored.
4. Disable the SellerHQ endpoint temporarily; trigger a staging paid-order event and verify a pending outbox row is retained.
5. Restore SellerHQ, authenticate as an administrator, and POST to `/api/admin/sellerhq/retry`. Confirm the row becomes `done`.
6. Verify the SellerHQ receiver treats repeated `record_sale` events idempotently by order identity before scheduling automatic retries.
7. Test order transition rejections from `REFUNDED` and `CANCELLED` and allowed fulfilment transitions.
8. Test that an old catalogue update cannot reopen RESERVED/SOLD stock.

Caution: automatic retry scheduling, end-to-end cross-service idempotency and atomic checkout creation are pending. Do not reopen storefront or declare Release 2 complete without these.

Release 1 still requires verification of old public photos and an unattended checkout expiry schedule.
