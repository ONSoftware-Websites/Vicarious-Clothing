-- =================================================================
-- Vicarious Clothing — full Supabase reset
-- Removes everything created by schema.sql and seed.sql.
-- Run this in the Supabase SQL editor to return to a blank slate,
-- then re-run schema.sql (+ seed.sql) to rebuild.
-- =================================================================

-- Trigger + functions first
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

-- Tables (cascade also removes their RLS policies, indexes and FKs)
drop table if exists product_images cascade;
drop table if exists product_measurements cascade;
drop table if exists product_marketplace cascade;
drop table if exists inventory_history cascade;
drop table if exists inventory_items cascade;
drop table if exists inventory_locations cascade;
drop table if exists order_items cascade;
drop table if exists payments cascade;
drop table if exists shipments cascade;
drop table if exists returns cascade;
drop table if exists refunds cascade;
drop table if exists orders cascade;
drop table if exists wishlist_items cascade;
drop table if exists wishlists cascade;
drop table if exists addresses cascade;
drop table if exists marketing_consents cascade;
drop table if exists stock_purchase_items cascade;
drop table if exists stock_purchases cascade;
drop table if exists purchase_leads cascade;
drop table if exists newsletter_subscribers cascade;
drop table if exists journal_posts cascade;
drop table if exists email_log cascade;
drop table if exists visits cascade;
drop table if exists discounts cascade;
drop table if exists audit_logs cascade;
drop table if exists products cascade;
drop table if exists profiles cascade;
drop table if exists brands cascade;
drop table if exists categories cascade;

-- Enums
drop type if exists condition_grade cascade;
drop type if exists inventory_status cascade;
drop type if exists order_status cascade;
drop type if exists lead_status cascade;
drop type if exists role_type cascade;
drop type if exists sales_channel cascade;
drop type if exists marketplace_status cascade;
drop type if exists discount_type cascade;
drop type if exists purchase_status cascade;
drop type if exists email_status cascade;
