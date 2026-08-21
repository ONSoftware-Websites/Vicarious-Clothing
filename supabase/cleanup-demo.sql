-- Vicarious Clothing — remove demo seed data
-- Run this in Supabase SQL editor if you ran seed.sql on a live project
-- and want a clean catalogue. Safe to run multiple times.
-- It deletes only the VC-000* demo SKUs, demo discounts, demo journal slugs,
-- and other seeded rows — real data you create after will not match these patterns.

-- Demo products and inventory (VC-000*)
delete from product_images where product_sku like 'VC-000%';
delete from product_measurements where product_sku like 'VC-000%';
delete from product_marketplace where sku like 'VC-000%';
delete from inventory_items where sku like 'VC-000%';
delete from products where sku like 'VC-000%';

-- Demo inventory locations used only by seed (optional — keep if you reused them)
-- delete from inventory_locations where id in ('A-04','A-01','B-12','A-06','A-02','B-03','B-07','C-02','A-08','A-03','C-05','A-05','B-09','B-05','A-07','C-01','A-09','C-04','C-03','B-04','C-06','B-08','C-07','C-08','A-10','B-02');

-- Demo brands seeded alongside products (optional)
-- delete from brands where slug in ('carhartt','supreme','nike','patagonia','the-north-face','carhartt-wip','levi-s','stussy','ralph-lauren','dickies','adidas','arc-teryx','vintage-band-merch','new-era','vintage-leather-co-','champion','vintage-workwear');

-- Demo discounts
delete from discounts where code in ('WELCOME10','JACKETS15','FIVEROFF','FREESHIP');

-- Demo newsletter subscribers
delete from newsletter_subscribers where email in ('amelia@example.co.uk','toby@example.co.uk');

-- Demo journal posts
delete from journal_posts where slug in ('how-we-grade-condition','why-one-of-one-is-the-point','what-makes-a-piece-a-vicarious-pick');

-- Demo orders and related (VC-0992 etc) — only if you seeded example orders
delete from order_items where order_id in ('VC-0992','VC-1048','VC-1052','VC-1055');
delete from orders where id in ('VC-0992','VC-1048','VC-1052','VC-1055');

-- Demo leads/purchases/email_log/visits (optional — uncomment if you seeded them)
-- delete from purchase_leads where id in ('lead-1','lead-2');
-- delete from stock_purchases where id in ('pur-1','pur-2');
-- delete from email_log where id in ('email-1','email-2');

-- Reset order counter — next real order will be VC-1000 if you started clean
-- (Supabase order IDs are generated in app code from max existing ID, so no sequence to reset)

select 'Demo cleanup complete. Catalogue should now be empty — add real stock via /admin/inventory.' as result;
