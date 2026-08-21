-- Vicarious Clothing seed data (generated from the demo store)
-- Run after schema.sql in the Supabase SQL editor.

insert into brands (name, slug) values ('Carhartt', 'carhartt');
insert into brands (name, slug) values ('Supreme', 'supreme');
insert into brands (name, slug) values ('Nike', 'nike');
insert into brands (name, slug) values ('Patagonia', 'patagonia');
insert into brands (name, slug) values ('The North Face', 'the-north-face');
insert into brands (name, slug) values ('Carhartt WIP', 'carhartt-wip');
insert into brands (name, slug) values ('Levi''s', 'levi-s');
insert into brands (name, slug) values ('Stussy', 'stussy');
insert into brands (name, slug) values ('Ralph Lauren', 'ralph-lauren');
insert into brands (name, slug) values ('Dickies', 'dickies');
insert into brands (name, slug) values ('Adidas', 'adidas');
insert into brands (name, slug) values ('Arc''teryx', 'arc-teryx');
insert into brands (name, slug) values ('Vintage Band Merch', 'vintage-band-merch');
insert into brands (name, slug) values ('New Era', 'new-era');
insert into brands (name, slug) values ('Vintage Leather Co.', 'vintage-leather-co-');
insert into brands (name, slug) values ('Champion', 'champion');
insert into brands (name, slug) values ('Vintage Workwear', 'vintage-workwear');
insert into inventory_locations (id, label) values ('A-04', 'A-04');
insert into inventory_locations (id, label) values ('A-01', 'A-01');
insert into inventory_locations (id, label) values ('B-12', 'B-12');
insert into inventory_locations (id, label) values ('A-06', 'A-06');
insert into inventory_locations (id, label) values ('A-02', 'A-02');
insert into inventory_locations (id, label) values ('B-03', 'B-03');
insert into inventory_locations (id, label) values ('B-07', 'B-07');
insert into inventory_locations (id, label) values ('C-02', 'C-02');
insert into inventory_locations (id, label) values ('A-08', 'A-08');
insert into inventory_locations (id, label) values ('A-03', 'A-03');
insert into inventory_locations (id, label) values ('C-05', 'C-05');
insert into inventory_locations (id, label) values ('A-05', 'A-05');
insert into inventory_locations (id, label) values ('B-09', 'B-09');
insert into inventory_locations (id, label) values ('B-05', 'B-05');
insert into inventory_locations (id, label) values ('A-07', 'A-07');
insert into inventory_locations (id, label) values ('C-01', 'C-01');
insert into inventory_locations (id, label) values ('A-09', 'A-09');
insert into inventory_locations (id, label) values ('C-04', 'C-04');
insert into inventory_locations (id, label) values ('C-03', 'C-03');
insert into inventory_locations (id, label) values ('B-04', 'B-04');
insert into inventory_locations (id, label) values ('C-06', 'C-06');
insert into inventory_locations (id, label) values ('B-08', 'B-08');
insert into inventory_locations (id, label) values ('C-07', 'C-07');
insert into inventory_locations (id, label) values ('C-08', 'C-08');
insert into inventory_locations (id, label) values ('A-10', 'A-10');
insert into inventory_locations (id, label) values ('B-02', 'B-02');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000381', 'vc-000381-carhartt-detroit-jacket', 'Detroit Jacket', 'Carhartt', 'jackets',
      'M', 'Carhartt Brown', '12oz cotton duck', 'very_good', 'Light wear around the cuffs and hem. Blanket lining is intact with no holes or repairs.',
      'The classic workwear icon, in the original 12oz duck canvas. Broken in exactly enough that it sits right, with years left in it. No branding changes, no fuss.', '{}', array['workwear', 'canvas', 'carhartt-brown'], 64,
      null, 18, 48, true, true, '2026-08-08T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000381', 'AVAILABLE', 'A-04', null, null, 'Private seller', '2026-07-28'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000381', 0, 'https://picsum.photos/seed/vc-VC-000381-0/900/1125', 'Carhartt Detroit Jacket - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000381', 1, 'https://picsum.photos/seed/vc-VC-000381-1/900/1125', 'Carhartt Detroit Jacket - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000381', 2, 'https://picsum.photos/seed/vc-VC-000381-2/900/1125', 'Carhartt Detroit Jacket - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000381', 3, 'https://picsum.photos/seed/vc-VC-000381-3/900/1125', 'Carhartt Detroit Jacket - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000381', 4, 'https://picsum.photos/seed/vc-VC-000381-4/900/1125', 'Carhartt Detroit Jacket - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000381', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000381', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000381', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000381', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000381', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000381', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000381', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000412', 'vc-000412-supreme-box-logo-hoodie', 'Box Logo Hoodie', 'Supreme', 'hoodies',
      'L', 'Heather Grey', 'Cotton fleece', 'excellent', 'Minimal wear. Print is sharp, no cracking or fading.',
      'FW22 heather grey box logo hoodie. Stored folded, print checked under light: no fade, no cracks. The one that never really got worn.', '{}', array['streetwear', 'fw22', 'box-logo'], 185,
      null, 110, 150, true, true, '2026-08-14T09:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000412', 'AVAILABLE', 'A-01', null, null, 'Private seller', '2026-08-05'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000412', 0, 'https://picsum.photos/seed/vc-VC-000412-0/900/1125', 'Supreme Box Logo Hoodie - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000412', 1, 'https://picsum.photos/seed/vc-VC-000412-1/900/1125', 'Supreme Box Logo Hoodie - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000412', 2, 'https://picsum.photos/seed/vc-VC-000412-2/900/1125', 'Supreme Box Logo Hoodie - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000412', 3, 'https://picsum.photos/seed/vc-VC-000412-3/900/1125', 'Supreme Box Logo Hoodie - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000412', 4, 'https://picsum.photos/seed/vc-VC-000412-4/900/1125', 'Supreme Box Logo Hoodie - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000412', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000412', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000412', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000412', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000412', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000412', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000412', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000398', 'vc-000398-nike-swoosh-hoodie', 'Swoosh Hoodie', 'Nike', 'hoodies',
      'M', 'Black', '80% cotton, 20% polyester', 'good', 'Small mark on the lower front (photographed). Slight pilling under the arms.',
      'Everyday black Nike hoodie in the heavier weight. The mark is small enough to be invisible in most light, priced to reflect it.', array['Small mark on lower front', 'Light pilling under arms'], array['sportswear', 'black', 'everyday'], 28,
      null, 9, 20, false, false, '2026-08-11T12:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000398', 'AVAILABLE', 'B-12', null, null, 'Private seller', '2026-08-01'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000398', 0, 'https://picsum.photos/seed/vc-VC-000398-0/900/1125', 'Nike Swoosh Hoodie - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000398', 1, 'https://picsum.photos/seed/vc-VC-000398-1/900/1125', 'Nike Swoosh Hoodie - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000398', 2, 'https://picsum.photos/seed/vc-VC-000398-2/900/1125', 'Nike Swoosh Hoodie - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000398', 3, 'https://picsum.photos/seed/vc-VC-000398-3/900/1125', 'Nike Swoosh Hoodie - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000398', 4, 'https://picsum.photos/seed/vc-VC-000398-4/900/1125', 'Nike Swoosh Hoodie - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000398', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000398', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000398', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000398', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000398', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000398', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000398', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000375', 'vc-000375-patagonia-classic-fleece-half-zip', 'Classic Fleece Half-Zip', 'Patagonia', 'knitwear',
      'M', 'Navy', 'Recycled polyester fleece', 'very_good', 'Light general wear, no pilling or fading.',
      'The fleece that made fleece acceptable. Deep navy, full zip is smooth, cuffs still snug.', '{}', array['outdoor', 'fleece', 'navy'], 45,
      null, 15, 34, false, false, '2026-07-30T14:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000375', 'AVAILABLE', 'A-06', null, null, 'Private seller', '2026-07-20'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000375', 0, 'https://picsum.photos/seed/vc-VC-000375-0/900/1125', 'Patagonia Classic Fleece Half-Zip - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000375', 1, 'https://picsum.photos/seed/vc-VC-000375-1/900/1125', 'Patagonia Classic Fleece Half-Zip - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000375', 2, 'https://picsum.photos/seed/vc-VC-000375-2/900/1125', 'Patagonia Classic Fleece Half-Zip - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000375', 3, 'https://picsum.photos/seed/vc-VC-000375-3/900/1125', 'Patagonia Classic Fleece Half-Zip - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000375', 4, 'https://picsum.photos/seed/vc-VC-000375-4/900/1125', 'Patagonia Classic Fleece Half-Zip - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000375', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000375', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000375', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000375', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000375', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000375', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000375', 'ebay', 'LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000402', 'vc-000402-the-north-face-arctic-parka', 'Arctic Parka', 'The North Face', 'jackets',
      'L', 'Black', 'Nylon shell, down fill', 'excellent', 'Worn a handful of times. Down loft intact.',
      'Proper winter parka with real down fill. Checked every seam and zip — this one is basically new with the tags off.', '{}', array['winter', 'down', 'parka'], 95,
      null, 40, 70, true, false, '2026-08-16T08:30:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000402', 'AVAILABLE', 'A-02', null, null, 'Private seller', '2026-08-10'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000402', 0, 'https://picsum.photos/seed/vc-VC-000402-0/900/1125', 'The North Face Arctic Parka - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000402', 1, 'https://picsum.photos/seed/vc-VC-000402-1/900/1125', 'The North Face Arctic Parka - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000402', 2, 'https://picsum.photos/seed/vc-VC-000402-2/900/1125', 'The North Face Arctic Parka - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000402', 3, 'https://picsum.photos/seed/vc-VC-000402-3/900/1125', 'The North Face Arctic Parka - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000402', 4, 'https://picsum.photos/seed/vc-VC-000402-4/900/1125', 'The North Face Arctic Parka - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000402', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000402', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000402', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000402', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000402', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000402', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000402', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000388', 'vc-000388-carhartt-wip-painter-s-double-knee', 'Painter''s Double Knee', 'Carhartt WIP', 'trousers',
      '32/32', 'Black', 'Dearborn canvas', 'good', 'Fading at the knees and seat, no rips or repairs.',
      'Double knee work trousers from the WIP line. The fade is even and honest — these look better now than new.', '{}', array['workwear', 'canvas', 'black'], 52,
      null, 16, 38, false, false, '2026-08-06T11:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000388', 'AVAILABLE', 'B-03', null, null, 'Private seller', '2026-07-26'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000388', 0, 'https://picsum.photos/seed/vc-VC-000388-0/900/1125', 'Carhartt WIP Painter''s Double Knee - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000388', 1, 'https://picsum.photos/seed/vc-VC-000388-1/900/1125', 'Carhartt WIP Painter''s Double Knee - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000388', 2, 'https://picsum.photos/seed/vc-VC-000388-2/900/1125', 'Carhartt WIP Painter''s Double Knee - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000388', 3, 'https://picsum.photos/seed/vc-VC-000388-3/900/1125', 'Carhartt WIP Painter''s Double Knee - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000388', 4, 'https://picsum.photos/seed/vc-VC-000388-4/900/1125', 'Carhartt WIP Painter''s Double Knee - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000388', 'Waist', '32"');
insert into product_measurements (product_sku, label, value) values ('VC-000388', 'Rise', '11.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000388', 'Inseam', '31"');
insert into product_marketplace (sku, channel, status) values ('VC-000388', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000388', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000388', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000388', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000420', 'vc-000420-levi-s-501-original-fit-jeans', '501 Original Fit Jeans', 'Levi''s', 'jeans',
      '34/32', 'Mid Blue', '100% cotton denim', 'very_good', 'Light fading, original hem, no repairs.',
      'The 501 everyone keeps coming back to. Mid blue wash with an even fade and the original hem untouched.', '{}', array['denim', '501', 'classic'], 42,
      null, 14, 30, false, false, '2026-08-13T13:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000420', 'AVAILABLE', 'B-07', null, null, 'Private seller', '2026-08-02'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000420', 0, 'https://picsum.photos/seed/vc-VC-000420-0/900/1125', 'Levi''s 501 Original Fit Jeans - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000420', 1, 'https://picsum.photos/seed/vc-VC-000420-1/900/1125', 'Levi''s 501 Original Fit Jeans - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000420', 2, 'https://picsum.photos/seed/vc-VC-000420-2/900/1125', 'Levi''s 501 Original Fit Jeans - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000420', 3, 'https://picsum.photos/seed/vc-VC-000420-3/900/1125', 'Levi''s 501 Original Fit Jeans - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000420', 4, 'https://picsum.photos/seed/vc-VC-000420-4/900/1125', 'Levi''s 501 Original Fit Jeans - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000420', 'Waist', '32"');
insert into product_measurements (product_sku, label, value) values ('VC-000420', 'Rise', '11.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000420', 'Inseam', '31"');
insert into product_marketplace (sku, channel, status) values ('VC-000420', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000420', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000420', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000420', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000367', 'vc-000367-nike-air-force-1-low', 'Air Force 1 Low', 'Nike', 'footwear',
      'UK 9', 'Triple White', 'Leather upper, rubber sole', 'good', 'Creasing to toe box, some scuffs on the sole. Cleaned and deodorised.',
      'Triple white AF1s, cleaned and ready for another summer. Classic crease pattern but no cracking or sole separation.', array['Toe box creasing', 'Sole scuffs'], array['sneakers', 'white', 'icon'], 38,
      null, 12, 26, false, false, '2026-07-25T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000367', 'AVAILABLE', 'C-02', null, null, 'Private seller', '2026-07-12'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000367', 0, 'https://picsum.photos/seed/vc-VC-000367-0/900/1125', 'Nike Air Force 1 Low - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000367', 1, 'https://picsum.photos/seed/vc-VC-000367-1/900/1125', 'Nike Air Force 1 Low - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000367', 2, 'https://picsum.photos/seed/vc-VC-000367-2/900/1125', 'Nike Air Force 1 Low - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000367', 3, 'https://picsum.photos/seed/vc-VC-000367-3/900/1125', 'Nike Air Force 1 Low - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000367', 4, 'https://picsum.photos/seed/vc-VC-000367-4/900/1125', 'Nike Air Force 1 Low - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000367', 'UK size', '9');
insert into product_measurements (product_sku, label, value) values ('VC-000367', 'Insole length', '27.5cm');
insert into product_marketplace (sku, channel, status) values ('VC-000367', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000367', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000367', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000367', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000431', 'vc-000431-stussy-ringer-tee', 'Ringer Tee', 'Stussy', 'tops',
      'L', 'White / Black', 'Cotton jersey', 'excellent', 'No visible wear. Print intact.',
      '90s-cut Stussy ringer tee with the script print. The cotton is still crisp, which is rare for these.', '{}', array['streetwear', 'tee', '90s'], 26,
      null, 8, 18, true, false, '2026-08-15T09:30:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000431', 'AVAILABLE', 'A-08', null, null, 'Private seller', '2026-08-08'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000431', 0, 'https://picsum.photos/seed/vc-VC-000431-0/900/1125', 'Stussy Ringer Tee - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000431', 1, 'https://picsum.photos/seed/vc-VC-000431-1/900/1125', 'Stussy Ringer Tee - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000431', 2, 'https://picsum.photos/seed/vc-VC-000431-2/900/1125', 'Stussy Ringer Tee - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000431', 3, 'https://picsum.photos/seed/vc-VC-000431-3/900/1125', 'Stussy Ringer Tee - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000431', 4, 'https://picsum.photos/seed/vc-VC-000431-4/900/1125', 'Stussy Ringer Tee - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000431', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000431', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000431', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000431', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000431', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000431', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000431', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000358', 'vc-000358-ralph-lauren-polo-bear-knit', 'Polo Bear Knit', 'Ralph Lauren', 'knitwear',
      'M', 'Cream', 'Wool blend', 'excellent', 'No pulls, holes or fading. Dry cleaned.',
      'The Polo Bear jumper in cream. Dry cleaned and de-pilled before listing — it looks fresh off the rack.', '{}', array['knit', 'polo', 'cream'], 58,
      null, 20, 42, false, false, '2026-08-02T15:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000358', 'AVAILABLE', 'A-03', null, null, 'Private seller', '2026-07-22'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000358', 0, 'https://picsum.photos/seed/vc-VC-000358-0/900/1125', 'Ralph Lauren Polo Bear Knit - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000358', 1, 'https://picsum.photos/seed/vc-VC-000358-1/900/1125', 'Ralph Lauren Polo Bear Knit - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000358', 2, 'https://picsum.photos/seed/vc-VC-000358-2/900/1125', 'Ralph Lauren Polo Bear Knit - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000358', 3, 'https://picsum.photos/seed/vc-VC-000358-3/900/1125', 'Ralph Lauren Polo Bear Knit - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000358', 4, 'https://picsum.photos/seed/vc-VC-000358-4/900/1125', 'Ralph Lauren Polo Bear Knit - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000358', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000358', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000358', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000358', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000358', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000358', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000358', 'ebay', 'LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000415', 'vc-000415-dickies-chore-coat', 'Chore Coat', 'Dickies', 'jackets',
      'S', 'Duck Brown', 'Cotton twill', 'fair', 'Visible wear throughout including paint flecks on the sleeve. Still fully functional.',
      'A proper working chore coat with genuine paint flecks and honest wear. If you want one that looks like it has lived, this is it.', array['Paint flecks on right sleeve', 'Fading at collar'], array['workwear', 'chore-coat', 'worn'], 18,
      null, 4, 10, false, false, '2026-07-18T11:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000415', 'AVAILABLE', 'C-05', null, null, 'Private seller', '2026-07-05'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000415', 0, 'https://picsum.photos/seed/vc-VC-000415-0/900/1125', 'Dickies Chore Coat - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000415', 1, 'https://picsum.photos/seed/vc-VC-000415-1/900/1125', 'Dickies Chore Coat - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000415', 2, 'https://picsum.photos/seed/vc-VC-000415-2/900/1125', 'Dickies Chore Coat - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000415', 3, 'https://picsum.photos/seed/vc-VC-000415-3/900/1125', 'Dickies Chore Coat - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000415', 4, 'https://picsum.photos/seed/vc-VC-000415-4/900/1125', 'Dickies Chore Coat - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000415', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000415', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000415', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000415', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000415', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000415', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000415', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000392', 'vc-000392-the-north-face-nuptse-700-vest', 'Nuptse 700 Vest', 'The North Face', 'jackets',
      'M', 'TNF Red', 'Nylon ripstop, down fill', 'very_good', 'Light wear, full loft, zip works smoothly.',
      'Nuptse 700 gilet in the classic red. Puffs up properly and zips cleanly — the winter layer that goes over everything.', '{}', array['outdoor', 'gilet', 'red'], 72,
      null, 30, 54, false, true, '2026-08-09T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000392', 'AVAILABLE', 'A-05', null, null, 'Private seller', '2026-07-29'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000392', 0, 'https://picsum.photos/seed/vc-VC-000392-0/900/1125', 'The North Face Nuptse 700 Vest - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000392', 1, 'https://picsum.photos/seed/vc-VC-000392-1/900/1125', 'The North Face Nuptse 700 Vest - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000392', 2, 'https://picsum.photos/seed/vc-VC-000392-2/900/1125', 'The North Face Nuptse 700 Vest - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000392', 3, 'https://picsum.photos/seed/vc-VC-000392-3/900/1125', 'The North Face Nuptse 700 Vest - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000392', 4, 'https://picsum.photos/seed/vc-VC-000392-4/900/1125', 'The North Face Nuptse 700 Vest - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000392', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000392', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000392', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000392', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000392', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000392', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000392', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000427', 'vc-000427-stussy-baggy-skate-jeans', 'Baggy Skate Jeans', 'Stussy', 'jeans',
      '32/30', 'Washed Blue', 'Denim', 'very_good', 'Light fade only, no rips.',
      'Wide-leg skate cut in a soft washed blue. Sits low, stacks right, zero damage.', '{}', array['skate', 'denim', 'baggy'], 48,
      null, 16, 34, false, false, '2026-08-12T14:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000427', 'AVAILABLE', 'B-09', null, null, 'Private seller', '2026-08-03'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000427', 0, 'https://picsum.photos/seed/vc-VC-000427-0/900/1125', 'Stussy Baggy Skate Jeans - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000427', 1, 'https://picsum.photos/seed/vc-VC-000427-1/900/1125', 'Stussy Baggy Skate Jeans - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000427', 2, 'https://picsum.photos/seed/vc-VC-000427-2/900/1125', 'Stussy Baggy Skate Jeans - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000427', 3, 'https://picsum.photos/seed/vc-VC-000427-3/900/1125', 'Stussy Baggy Skate Jeans - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000427', 4, 'https://picsum.photos/seed/vc-VC-000427-4/900/1125', 'Stussy Baggy Skate Jeans - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000427', 'Waist', '32"');
insert into product_measurements (product_sku, label, value) values ('VC-000427', 'Rise', '11.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000427', 'Inseam', '31"');
insert into product_marketplace (sku, channel, status) values ('VC-000427', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000427', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000427', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000427', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000406', 'vc-000406-adidas-track-jacket', 'Track Jacket', 'Adidas', 'jackets',
      'L', 'Black / White', 'Polyester tricot', 'good', 'Some wear to cuffs, general light marks.',
      'Three-stripe track top with the vintage cut. Collar stands up like it should, stripes are clean.', '{}', array['sportswear', 'three-stripes', 'retro'], 24,
      null, 7, 16, false, false, '2026-08-04T09:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000406', 'AVAILABLE', 'B-05', null, null, 'Private seller', '2026-07-24'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000406', 0, 'https://picsum.photos/seed/vc-VC-000406-0/900/1125', 'Adidas Track Jacket - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000406', 1, 'https://picsum.photos/seed/vc-VC-000406-1/900/1125', 'Adidas Track Jacket - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000406', 2, 'https://picsum.photos/seed/vc-VC-000406-2/900/1125', 'Adidas Track Jacket - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000406', 3, 'https://picsum.photos/seed/vc-VC-000406-3/900/1125', 'Adidas Track Jacket - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000406', 4, 'https://picsum.photos/seed/vc-VC-000406-4/900/1125', 'Adidas Track Jacket - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000406', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000406', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000406', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000406', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000406', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000406', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000406', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000363', 'vc-000363-arc-teryx-beta-lt-shell', 'Beta LT Shell', 'Arc''teryx', 'jackets',
      'M', 'Forage Green', '3L Gore-Tex', 'very_good', 'DWR re-applied. No delamination, seams sealed.',
      'Beta LT hardshell, recently re-treated and ready for the hills. All taped seams checked, no delamination anywhere.', '{}', array['outdoor', 'gore-tex', 'shell'], 155,
      null, 85, 120, false, true, '2026-08-10T08:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000363', 'AVAILABLE', 'A-07', null, null, 'Private seller', '2026-07-30'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000363', 0, 'https://picsum.photos/seed/vc-VC-000363-0/900/1125', 'Arc''teryx Beta LT Shell - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000363', 1, 'https://picsum.photos/seed/vc-VC-000363-1/900/1125', 'Arc''teryx Beta LT Shell - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000363', 2, 'https://picsum.photos/seed/vc-VC-000363-2/900/1125', 'Arc''teryx Beta LT Shell - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000363', 3, 'https://picsum.photos/seed/vc-VC-000363-3/900/1125', 'Arc''teryx Beta LT Shell - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000363', 4, 'https://picsum.photos/seed/vc-VC-000363-4/900/1125', 'Arc''teryx Beta LT Shell - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000363', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000363', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000363', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000363', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000363', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000363', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000363', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000434', 'vc-000434-carhartt-logo-beanie', 'Logo Beanie', 'Carhartt', 'accessories',
      'One Size', 'Hamilton Brown', 'Acrylic knit', 'new_without_tags', 'Unused, tags removed.',
      'Classic knit beanie in Hamilton brown. Never worn, tags just never survived the drawer.', '{}', array['beanie', 'winter', 'knit'], 12,
      null, 3, 8, false, false, '2026-08-15T12:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000434', 'AVAILABLE', 'C-01', null, null, 'Private seller', '2026-08-09'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000434', 0, 'https://picsum.photos/seed/vc-VC-000434-0/900/1125', 'Carhartt Logo Beanie - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000434', 1, 'https://picsum.photos/seed/vc-VC-000434-1/900/1125', 'Carhartt Logo Beanie - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000434', 2, 'https://picsum.photos/seed/vc-VC-000434-2/900/1125', 'Carhartt Logo Beanie - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000434', 3, 'https://picsum.photos/seed/vc-VC-000434-3/900/1125', 'Carhartt Logo Beanie - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000434', 4, 'https://picsum.photos/seed/vc-VC-000434-4/900/1125', 'Carhartt Logo Beanie - image 5');
insert into product_marketplace (sku, channel, status) values ('VC-000434', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000434', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000434', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000434', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000372', 'vc-000372-patagonia-retro-x-fleece', 'Retro X Fleece', 'Patagonia', 'knitwear',
      'L', 'Forge Grey', 'Polartec fleece', 'very_good', 'Light wear, windproof liner intact.',
      'Retro-X fleece jacket with the windproof liner. The collar still stands tall and the pile is deep.', '{}', array['fleece', 'outdoor', 'retro'], 85,
      null, 35, 62, false, false, '2026-08-07T13:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000372', 'AVAILABLE', 'A-09', null, null, 'Private seller', '2026-07-27'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000372', 0, 'https://picsum.photos/seed/vc-VC-000372-0/900/1125', 'Patagonia Retro X Fleece - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000372', 1, 'https://picsum.photos/seed/vc-VC-000372-1/900/1125', 'Patagonia Retro X Fleece - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000372', 2, 'https://picsum.photos/seed/vc-VC-000372-2/900/1125', 'Patagonia Retro X Fleece - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000372', 3, 'https://picsum.photos/seed/vc-VC-000372-3/900/1125', 'Patagonia Retro X Fleece - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000372', 4, 'https://picsum.photos/seed/vc-VC-000372-4/900/1125', 'Patagonia Retro X Fleece - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000372', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000372', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000372', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000372', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000372', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000372', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000372', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000441', 'vc-000441-vintage-band-merch-oversized-graphic-tee', 'Oversized Graphic Tee', 'Vintage Band Merch', 'vintage',
      'XL', 'Faded Black', 'Heavy cotton', 'good', 'Faded exactly right. Two small pinholes on the back, photographed.',
      'Single-stitch heavy cotton band tee from the early 2000s. The fade is authentic — this is what new tees are trying to copy.', array['Two small pinholes on the back'], array['vintage', 'band-tee', 'single-stitch'], 32,
      null, 10, 22, true, false, '2026-08-14T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000441', 'AVAILABLE', 'C-04', null, null, 'Private seller', '2026-08-06'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000441', 0, 'https://picsum.photos/seed/vc-VC-000441-0/900/1125', 'Vintage Band Merch Oversized Graphic Tee - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000441', 1, 'https://picsum.photos/seed/vc-VC-000441-1/900/1125', 'Vintage Band Merch Oversized Graphic Tee - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000441', 2, 'https://picsum.photos/seed/vc-VC-000441-2/900/1125', 'Vintage Band Merch Oversized Graphic Tee - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000441', 3, 'https://picsum.photos/seed/vc-VC-000441-3/900/1125', 'Vintage Band Merch Oversized Graphic Tee - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000441', 4, 'https://picsum.photos/seed/vc-VC-000441-4/900/1125', 'Vintage Band Merch Oversized Graphic Tee - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000441', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000441', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000441', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000441', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000441', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000441', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000441', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000395', 'vc-000395-new-era-cap', 'Cap', 'New Era', 'accessories',
      '7 3/8', 'Navy', 'Wool blend', 'excellent', 'Minimal wear, brim shape intact.',
      'Fitted New Era cap in navy. Brim keeps its curve, sweatband is clean.', '{}', array['cap', 'fitted', 'navy'], 14,
      null, 4, 9, false, false, '2026-08-05T15:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000395', 'AVAILABLE', 'C-03', null, null, 'Private seller', '2026-07-25'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000395', 0, 'https://picsum.photos/seed/vc-VC-000395-0/900/1125', 'New Era Cap - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000395', 1, 'https://picsum.photos/seed/vc-VC-000395-1/900/1125', 'New Era Cap - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000395', 2, 'https://picsum.photos/seed/vc-VC-000395-2/900/1125', 'New Era Cap - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000395', 3, 'https://picsum.photos/seed/vc-VC-000395-3/900/1125', 'New Era Cap - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000395', 4, 'https://picsum.photos/seed/vc-VC-000395-4/900/1125', 'New Era Cap - image 5');
insert into product_marketplace (sku, channel, status) values ('VC-000395', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000395', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000395', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000395', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000409', 'vc-000409-carhartt-wip-cargo-trousers', 'Cargo Trousers', 'Carhartt WIP', 'trousers',
      '30/32', 'Dusty Olive', 'Cotton twill', 'very_good', 'Light wear only, all pockets functional.',
      'Six-pocket cargos in a muted olive that goes with everything. All hardware intact, all pockets work.', '{}', array['cargo', 'olive', 'twill'], 46,
      null, 15, 32, false, false, '2026-08-03T11:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000409', 'AVAILABLE', 'B-04', null, null, 'Private seller', '2026-07-21'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000409', 0, 'https://picsum.photos/seed/vc-VC-000409-0/900/1125', 'Carhartt WIP Cargo Trousers - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000409', 1, 'https://picsum.photos/seed/vc-VC-000409-1/900/1125', 'Carhartt WIP Cargo Trousers - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000409', 2, 'https://picsum.photos/seed/vc-VC-000409-2/900/1125', 'Carhartt WIP Cargo Trousers - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000409', 3, 'https://picsum.photos/seed/vc-VC-000409-3/900/1125', 'Carhartt WIP Cargo Trousers - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000409', 4, 'https://picsum.photos/seed/vc-VC-000409-4/900/1125', 'Carhartt WIP Cargo Trousers - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000409', 'Waist', '32"');
insert into product_measurements (product_sku, label, value) values ('VC-000409', 'Rise', '11.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000409', 'Inseam', '31"');
insert into product_marketplace (sku, channel, status) values ('VC-000409', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000409', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000409', 'depop', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000409', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000449', 'vc-000449-vintage-leather-co--leather-bomber', 'Leather Bomber', 'Vintage Leather Co.', 'vintage',
      'L', 'Dark Brown', 'Genuine leather', 'good', 'Beautiful patina, lining has minor wear at the collar.',
      '90s leather bomber with a patina you cannot fake. Zip is solid, leather is supple, lining has honest age.', array['Lining wear at collar'], array['vintage', 'leather', 'bomber'], 88,
      null, 38, 64, false, false, '2026-08-11T16:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000449', 'AVAILABLE', 'C-06', null, null, 'Private seller', '2026-08-01'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000449', 0, 'https://picsum.photos/seed/vc-VC-000449-0/900/1125', 'Vintage Leather Co. Leather Bomber - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000449', 1, 'https://picsum.photos/seed/vc-VC-000449-1/900/1125', 'Vintage Leather Co. Leather Bomber - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000449', 2, 'https://picsum.photos/seed/vc-VC-000449-2/900/1125', 'Vintage Leather Co. Leather Bomber - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000449', 3, 'https://picsum.photos/seed/vc-VC-000449-3/900/1125', 'Vintage Leather Co. Leather Bomber - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000449', 4, 'https://picsum.photos/seed/vc-VC-000449-4/900/1125', 'Vintage Leather Co. Leather Bomber - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000449', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000449', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000449', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000449', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000449', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000449', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000449', 'ebay', 'LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000422', 'vc-000422-champion-hooded-sweatshirt', 'Hooded Sweatshirt', 'Champion', 'hoodies',
      'S', 'Oxford Grey', 'Reverse weave', 'very_good', 'Light wash wear, ribbed cuffs intact.',
      'Reverse weave hoodie in oxford grey. The fabric that refuses to lose its shape, and it hasn''t.', '{}', array['hoodie', 'reverse-weave', 'grey'], 30,
      null, 10, 21, false, false, '2026-08-09T09:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000422', 'AVAILABLE', 'B-08', null, null, 'Private seller', '2026-07-29'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000422', 0, 'https://picsum.photos/seed/vc-VC-000422-0/900/1125', 'Champion Hooded Sweatshirt - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000422', 1, 'https://picsum.photos/seed/vc-VC-000422-1/900/1125', 'Champion Hooded Sweatshirt - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000422', 2, 'https://picsum.photos/seed/vc-VC-000422-2/900/1125', 'Champion Hooded Sweatshirt - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000422', 3, 'https://picsum.photos/seed/vc-VC-000422-3/900/1125', 'Champion Hooded Sweatshirt - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000422', 4, 'https://picsum.photos/seed/vc-VC-000422-4/900/1125', 'Champion Hooded Sweatshirt - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000422', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000422', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000422', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000422', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000422', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000422', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000422', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000456', 'vc-000456-vintage-workwear-gas-station-cap', 'Gas Station Cap', 'Vintage Workwear', 'vintage',
      'Adjustable', 'Faded Red', 'Cotton twill', 'fair', 'Heavy fade and sweat stains around the band. The charm is real.',
      'A genuine old garage cap with the fade only decades of sun can produce. Adjustable strap, no tears.', array['Fading', 'Band staining'], array['vintage', 'cap', 'workwear'], 15,
      null, 3, 8, false, false, '2026-07-28T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000456', 'AVAILABLE', 'C-07', null, null, 'Private seller', '2026-07-15'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000456', 0, 'https://picsum.photos/seed/vc-VC-000456-0/900/1125', 'Vintage Workwear Gas Station Cap - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000456', 1, 'https://picsum.photos/seed/vc-VC-000456-1/900/1125', 'Vintage Workwear Gas Station Cap - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000456', 2, 'https://picsum.photos/seed/vc-VC-000456-2/900/1125', 'Vintage Workwear Gas Station Cap - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000456', 3, 'https://picsum.photos/seed/vc-VC-000456-3/900/1125', 'Vintage Workwear Gas Station Cap - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000456', 4, 'https://picsum.photos/seed/vc-VC-000456-4/900/1125', 'Vintage Workwear Gas Station Cap - image 5');
insert into product_marketplace (sku, channel, status) values ('VC-000456', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000456', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000456', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000456', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000401', 'vc-000401-nike-90s-windbreaker', '90s Windbreaker', 'Nike', 'vintage',
      'M', 'Purple / Teal', 'Nylon', 'good', 'Some creasing and light marks. Colours still vivid.',
      'Proper 90s windbreaker in the loudest colourway we could find. Cuffs and waistband elastic still spring back.', '{}', array['vintage', '90s', 'windbreaker'], 36,
      null, 11, 24, false, false, '2026-08-01T14:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000401', 'AVAILABLE', 'C-08', null, null, 'Private seller', '2026-07-19'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000401', 0, 'https://picsum.photos/seed/vc-VC-000401-0/900/1125', 'Nike 90s Windbreaker - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000401', 1, 'https://picsum.photos/seed/vc-VC-000401-1/900/1125', 'Nike 90s Windbreaker - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000401', 2, 'https://picsum.photos/seed/vc-VC-000401-2/900/1125', 'Nike 90s Windbreaker - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000401', 3, 'https://picsum.photos/seed/vc-VC-000401-3/900/1125', 'Nike 90s Windbreaker - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000401', 4, 'https://picsum.photos/seed/vc-VC-000401-4/900/1125', 'Nike 90s Windbreaker - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000401', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000401', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000401', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000401', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000401', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000401', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000401', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000384', 'vc-000384-supreme-logo-cap', 'Logo Cap', 'Supreme', 'accessories',
      'Adjustable', 'Black', 'Cotton twill', 'new_with_tags', 'Unused with original tags attached.',
      'Camps cap in black, still tagged. Crown is crisp, strap untouched.', '{}', array['cap', 'streetwear', 'black'], 55,
      null, 30, 40, true, false, '2026-08-16T09:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000384', 'AVAILABLE', 'A-10', null, null, 'Private seller', '2026-08-12'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000384', 0, 'https://picsum.photos/seed/vc-VC-000384-0/900/1125', 'Supreme Logo Cap - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000384', 1, 'https://picsum.photos/seed/vc-VC-000384-1/900/1125', 'Supreme Logo Cap - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000384', 2, 'https://picsum.photos/seed/vc-VC-000384-2/900/1125', 'Supreme Logo Cap - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000384', 3, 'https://picsum.photos/seed/vc-VC-000384-3/900/1125', 'Supreme Logo Cap - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000384', 4, 'https://picsum.photos/seed/vc-VC-000384-4/900/1125', 'Supreme Logo Cap - image 5');
insert into product_marketplace (sku, channel, status) values ('VC-000384', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000384', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000384', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000384', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000377', 'vc-000377-levi-s-denim-trucker-jacket', 'Denim Trucker Jacket', 'Levi''s', 'jackets',
      'M', 'Washed Blue', 'Denim', 'very_good', 'Even fade, no wear-through anywhere.',
      'Type III trucker with the perfect all-over fade and no weak points. Buttons all original and firm.', '{}', array['denim', 'trucker', 'classic'], 62,
      null, 20, 44, false, false, '2026-08-06T08:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000377', 'AVAILABLE', 'B-02', null, null, 'Private seller', '2026-07-26'
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000377', 0, 'https://picsum.photos/seed/vc-VC-000377-0/900/1125', 'Levi''s Denim Trucker Jacket - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000377', 1, 'https://picsum.photos/seed/vc-VC-000377-1/900/1125', 'Levi''s Denim Trucker Jacket - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000377', 2, 'https://picsum.photos/seed/vc-VC-000377-2/900/1125', 'Levi''s Denim Trucker Jacket - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000377', 3, 'https://picsum.photos/seed/vc-VC-000377-3/900/1125', 'Levi''s Denim Trucker Jacket - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000377', 4, 'https://picsum.photos/seed/vc-VC-000377-4/900/1125', 'Levi''s Denim Trucker Jacket - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000377', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000377', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000377', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000377', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000377', 'vinted', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000377', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000377', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000365', 'vc-000365-the-north-face-arctic-parka-sold', 'Arctic Parka - Sold', 'The North Face', 'jackets',
      'M', 'Navy', 'Nylon shell, down fill', 'excellent', 'SOLD - kept for archive.',
      'Sold piece shown on the homepage recently sold rail.', '{}', array['winter', 'parka'], 110,
      null, 45, 80, false, false, '2026-07-10T10:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000365', 'SOLD', null, null, '2026-08-14T18:20:00Z', null, null
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000365', 0, 'https://picsum.photos/seed/vc-VC-000365-0/900/1125', 'The North Face Arctic Parka - Sold - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000365', 1, 'https://picsum.photos/seed/vc-VC-000365-1/900/1125', 'The North Face Arctic Parka - Sold - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000365', 2, 'https://picsum.photos/seed/vc-VC-000365-2/900/1125', 'The North Face Arctic Parka - Sold - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000365', 3, 'https://picsum.photos/seed/vc-VC-000365-3/900/1125', 'The North Face Arctic Parka - Sold - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000365', 4, 'https://picsum.photos/seed/vc-VC-000365-4/900/1125', 'The North Face Arctic Parka - Sold - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000365', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000365', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000365', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000365', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000365', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000365', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000365', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000362', 'vc-000362-the-north-face-puffer-jacket-sold', 'Puffer Jacket - Sold', 'The North Face', 'jackets',
      'S', 'Black', 'Nylon, down fill', 'very_good', 'SOLD - kept for archive.',
      'Sold piece shown on the homepage recently sold rail.', '{}', array['winter', 'puffer'], 78,
      null, 30, 55, false, false, '2026-07-06T09:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000362', 'SOLD', null, null, '2026-08-13T11:05:00Z', null, null
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000362', 0, 'https://picsum.photos/seed/vc-VC-000362-0/900/1125', 'The North Face Puffer Jacket - Sold - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000362', 1, 'https://picsum.photos/seed/vc-VC-000362-1/900/1125', 'The North Face Puffer Jacket - Sold - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000362', 2, 'https://picsum.photos/seed/vc-VC-000362-2/900/1125', 'The North Face Puffer Jacket - Sold - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000362', 3, 'https://picsum.photos/seed/vc-VC-000362-3/900/1125', 'The North Face Puffer Jacket - Sold - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000362', 4, 'https://picsum.photos/seed/vc-VC-000362-4/900/1125', 'The North Face Puffer Jacket - Sold - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000362', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000362', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000362', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000362', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000362', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000362', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000362', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000359', 'vc-000359-patagonia-fleece-hoodie-sold', 'Fleece Hoodie - Sold', 'Patagonia', 'hoodies',
      'M', 'Tan', 'Fleece', 'excellent', 'SOLD - kept for archive.',
      'Sold piece shown on the homepage recently sold rail.', '{}', array['fleece', 'outdoor'], 55,
      null, 20, 38, false, false, '2026-07-14T12:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000359', 'SOLD', null, null, '2026-08-12T09:40:00Z', null, null
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000359', 0, 'https://picsum.photos/seed/vc-VC-000359-0/900/1125', 'Patagonia Fleece Hoodie - Sold - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000359', 1, 'https://picsum.photos/seed/vc-VC-000359-1/900/1125', 'Patagonia Fleece Hoodie - Sold - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000359', 2, 'https://picsum.photos/seed/vc-VC-000359-2/900/1125', 'Patagonia Fleece Hoodie - Sold - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000359', 3, 'https://picsum.photos/seed/vc-VC-000359-3/900/1125', 'Patagonia Fleece Hoodie - Sold - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000359', 4, 'https://picsum.photos/seed/vc-VC-000359-4/900/1125', 'Patagonia Fleece Hoodie - Sold - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000359', 'Pit to pit', '21"');
insert into product_measurements (product_sku, label, value) values ('VC-000359', 'Length', '27"');
insert into product_measurements (product_sku, label, value) values ('VC-000359', 'Sleeve', '24"');
insert into product_marketplace (sku, channel, status) values ('VC-000359', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000359', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000359', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000359', 'ebay', 'NOT_LISTED');
insert into products (sku, slug, name, brand, category, size, colour, material, condition, condition_notes, description, defects, tags, price, compare_at_price, cost, floor_price, is_pick, featured, listed_at) values (
      'VC-000354', 'vc-000354-levi-s-denim-jacket-sold', 'Denim Jacket - Sold', 'Levi''s', 'jackets',
      'L', 'Mid Blue', 'Denim', 'good', 'SOLD - kept for archive.',
      'Sold piece shown on the homepage recently sold rail.', '{}', array['denim', 'trucker'], 40,
      null, 12, 26, false, false, '2026-07-02T15:00:00Z'
    );
insert into inventory_items (sku, status, location_id, reserved_until, sold_at, acquisition_source, purchase_date) values (
      'VC-000354', 'SOLD', null, null, '2026-08-10T16:45:00Z', null, null
    );
insert into product_images (product_sku, position, src, alt) values ('VC-000354', 0, 'https://picsum.photos/seed/vc-VC-000354-0/900/1125', 'Levi''s Denim Jacket - Sold - image 1');
insert into product_images (product_sku, position, src, alt) values ('VC-000354', 1, 'https://picsum.photos/seed/vc-VC-000354-1/900/1125', 'Levi''s Denim Jacket - Sold - image 2');
insert into product_images (product_sku, position, src, alt) values ('VC-000354', 2, 'https://picsum.photos/seed/vc-VC-000354-2/900/1125', 'Levi''s Denim Jacket - Sold - image 3');
insert into product_images (product_sku, position, src, alt) values ('VC-000354', 3, 'https://picsum.photos/seed/vc-VC-000354-3/900/1125', 'Levi''s Denim Jacket - Sold - image 4');
insert into product_images (product_sku, position, src, alt) values ('VC-000354', 4, 'https://picsum.photos/seed/vc-VC-000354-4/900/1125', 'Levi''s Denim Jacket - Sold - image 5');
insert into product_measurements (product_sku, label, value) values ('VC-000354', 'Pit to pit', '23.5"');
insert into product_measurements (product_sku, label, value) values ('VC-000354', 'Length', '26"');
insert into product_measurements (product_sku, label, value) values ('VC-000354', 'Sleeve', '25"');
insert into product_marketplace (sku, channel, status) values ('VC-000354', 'website', 'LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000354', 'vinted', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000354', 'depop', 'NOT_LISTED');
insert into product_marketplace (sku, channel, status) values ('VC-000354', 'ebay', 'NOT_LISTED');
insert into discounts (id, code, type, value, description, min_basket, categories, expires_at, usage_limit, used_count, used_emails, active, created_at) values (
      'disc-1', 'WELCOME10', 'percentage', 10, 'First-order welcome code', 30,
      '{}', null, 200, 0, '{}', true, '2026-08-01T09:00:00Z'
    );
insert into discounts (id, code, type, value, description, min_basket, categories, expires_at, usage_limit, used_count, used_emails, active, created_at) values (
      'disc-2', 'JACKETS15', 'percentage', 15, '15% off jackets', null,
      array['jackets'], '2026-12-31T23:59:59Z', 100, 0, '{}', true, '2026-08-05T09:00:00Z'
    );
insert into discounts (id, code, type, value, description, min_basket, categories, expires_at, usage_limit, used_count, used_emails, active, created_at) values (
      'disc-3', 'FIVEROFF', 'fixed', 5, '£5 off orders over £40', 40,
      '{}', null, 50, 3, array['example@customer.co.uk', 'buyer@example.co.uk', 'henry@example.com'], true, '2026-07-20T09:00:00Z'
    );
insert into discounts (id, code, type, value, description, min_basket, categories, expires_at, usage_limit, used_count, used_emails, active, created_at) values (
      'disc-4', 'FREESHIP', 'free_delivery', 0, 'Free standard delivery', null,
      '{}', null, 150, 0, '{}', true, '2026-08-10T09:00:00Z'
    );
insert into orders (id, email, name, status, subtotal, discount_code, discount_type, discount_description, discount_amount, delivery, total, channel, address_line1, address_line2, address_city, address_postcode, address_country, payment_provider, payment_intent_id, created_at, updated_at) values (
      'VC-0992', 'example@customer.co.uk', 'Amelia Wright', 'DELIVERED', 55,
      null, null, null, 0,
      0, 55, 'website', '14 Elm Grove', null,
      'Leeds', 'LS6 2RT', 'United Kingdom',
      'demo', null, '2026-07-18T12:40:00Z', '2026-07-22T09:10:00Z'
    );
insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        'VC-0992', 'VC-000359', 'Fleece Hoodie', 'Patagonia', 'M', 'excellent', 55, 'https://picsum.photos/seed/vc-VC-000359-0/900/1125'
      );
insert into orders (id, email, name, status, subtotal, discount_code, discount_type, discount_description, discount_amount, delivery, total, channel, address_line1, address_line2, address_city, address_postcode, address_country, payment_provider, payment_intent_id, created_at, updated_at) values (
      'VC-1048', 'henry@example.com', 'Henry Smith', 'DISPATCHED', 110,
      null, null, null, 0,
      0, 110, 'website', '2 Wharf Street', null,
      'Manchester', 'M1 4AL', 'United Kingdom',
      'demo', null, '2026-08-14T18:20:00Z', '2026-08-16T10:00:00Z'
    );
insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        'VC-1048', 'VC-000365', 'Arctic Parka', 'The North Face', 'M', 'excellent', 110, 'https://picsum.photos/seed/vc-VC-000365-0/900/1125'
      );
insert into orders (id, email, name, status, subtotal, discount_code, discount_type, discount_description, discount_amount, delivery, total, channel, address_line1, address_line2, address_city, address_postcode, address_country, payment_provider, payment_intent_id, created_at, updated_at) values (
      'VC-1052', 'buyer@example.co.uk', 'Grace Okafor', 'PAID', 52,
      null, null, null, 0,
      0, 52, 'depop', '88 Queens Road', null,
      'Bristol', 'BS8 1QU', 'United Kingdom',
      'demo', null, '2026-08-16T11:05:00Z', '2026-08-16T11:05:00Z'
    );
insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        'VC-1052', 'VC-000354', 'Denim Jacket', 'Levi''s', 'L', 'good', 40, 'https://picsum.photos/seed/vc-VC-000354-0/900/1125'
      );
insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        'VC-1052', 'VC-000434', 'Logo Beanie', 'Carhartt', 'One Size', 'new_without_tags', 12, 'https://picsum.photos/seed/vc-VC-000434-0/900/1125'
      );
insert into orders (id, email, name, status, subtotal, discount_code, discount_type, discount_description, discount_amount, delivery, total, channel, address_line1, address_line2, address_city, address_postcode, address_country, payment_provider, payment_intent_id, created_at, updated_at) values (
      'VC-1055', 'shopper@example.net', 'Tom Bradley', 'READY_TO_DISPATCH', 78,
      null, null, null, 0,
      0, 78, 'vinted', '31 Park Road', null,
      'Sheffield', 'S2 4NX', 'United Kingdom',
      'demo', null, '2026-08-16T14:30:00Z', '2026-08-16T15:00:00Z'
    );
insert into order_items (order_id, sku, name, brand, size, condition, price, image) values (
        'VC-1055', 'VC-000362', 'Puffer Jacket', 'The North Face', 'S', 'very_good', 78, 'https://picsum.photos/seed/vc-VC-000362-0/900/1125'
      );
insert into purchase_leads (id, name, email, brand, item_type, size, condition, notes, offer, status, created_at) values (
      'lead-1', 'Sarah Jenkins', 'sarah.j@example.com', 'Carhartt', 'Jacket', 'M', 'Good', 'Detroit jacket from around 2019, hoping for £40ish.', null, 'NEW', '2026-08-16T08:12:00Z'
    );
insert into purchase_leads (id, name, email, brand, item_type, size, condition, notes, offer, status, created_at) values (
      'lead-2', 'Marcus Reid', 'marcus.r@example.com', 'Nike', 'Footwear', 'UK 10', 'Very good', 'Two pairs of AF1s, one white one black.', null, 'REVIEWING', '2026-08-15T16:40:00Z'
    );
insert into stock_purchases (id, seller_name, seller_email, amount, status, notes, lead_id, created_at, paid_at) values (
      'pur-1', 'Sarah Jenkins', 'sarah.j@example.com', 18, 'PAID', 'Carhartt Detroit jacket, collected in person.', null, '2026-07-28T14:00:00Z', '2026-07-28T14:10:00Z'
    );
insert into stock_purchase_items (purchase_id, sku, name, brand, cost) values (
        'pur-1', 'VC-000381', 'Detroit Jacket', 'Carhartt', 18
      );
insert into stock_purchases (id, seller_name, seller_email, amount, status, notes, lead_id, created_at, paid_at) values (
      'pur-2', 'Marcus Reid', 'marcus.r@example.com', 35, 'AGREED', 'Agreed £35 for the shell plus a beanie.', null, '2026-08-15T17:00:00Z', null
    );
insert into stock_purchase_items (purchase_id, sku, name, brand, cost) values (
        'pur-2', 'VC-000363', 'Beta LT Shell', 'Arc''teryx', 85
      );
insert into newsletter_subscribers (email, source, consented_at) values ('amelia@example.co.uk', 'seed', '2026-08-10T09:00:00Z');
insert into newsletter_subscribers (email, source, consented_at) values ('toby@example.co.uk', 'seed', '2026-08-12T18:30:00Z');
insert into journal_posts (id, slug, title, excerpt, body, cover_image, published, published_at) values (
      'post-1', 'how-we-grade-condition', 'How we grade condition', 'The six-grade scale behind every listing, and why we photograph every defect.', array['Every piece that comes into Vicarious gets graded on the same six-point scale before it ever goes near the site. The grade is a summary, not a substitute for disclosure — so alongside the grade, every known defect gets its own photograph and a line in the listing.', 'New with Tags means exactly that: unused, tags attached. New without Tags is the same piece minus the card. From Excellent downwards we''re describing wear: minimal signs, light signs with no significant defects, noticeable wear with everything disclosed, and Fair — visible wear that''s still saleable.', 'The honest version: a grade only gets you so far. The real detail lives in the measurements and the photographs. If we wouldn''t wear it, it doesn''t go up.'], 'https://picsum.photos/seed/vc-journal-1/1200/750', true, '2026-08-10T09:00:00Z'
    );
insert into journal_posts (id, slug, title, excerpt, body, cover_image, published, published_at) values (
      'post-2', 'why-one-of-one-is-the-point', 'Why one-of-one is the point', 'Most of what we sell will never restock. That''s not a bug — it''s the whole idea.', array['When a piece on the site sells, that''s usually it. No size runs, no restock, no ''more coming soon''. It''s a strange thing to build a shop around — and it''s exactly why we did.', 'One-of-one stock changes how you shop. There''s no waiting for the right size to come back; there''s just a decision about the one in front of you. It makes every drop feel like what it is: a small pile of good clothes that will not be here tomorrow.', 'It also keeps us honest. Nothing stays listed that we wouldn''t stand behind, because there''s no volume to hide behind either.'], null, true, '2026-08-03T09:00:00Z'
    );
insert into journal_posts (id, slug, title, excerpt, body, cover_image, published, published_at) values (
      'post-3', 'what-makes-a-piece-a-vicarious-pick', 'What makes a piece a Vicarious Pick', 'The short answer: we''d fight over it. The longer answer involves three checks.', array['Every so often a piece lands that everyone in the studio wants to keep. When that happens twice in a row, it becomes a Vicarious Pick.', 'The checks are simple: does it have a story worth telling, is the condition genuinely good, and would we pay our own price for it? Two out of three isn''t enough — all three, every time.', 'Picks get the first slot in our editorial edits and usually don''t last long. You''ll find them tagged on their product pages, and collected under the Picks edit in the shop.'], null, true, '2026-07-27T09:00:00Z'
    );
insert into email_log (id, recipient, subject, template, status, provider, sent_at, preview) values (
      'email-1', 'example@customer.co.uk', 'Your Vicarious order VC-0992', 'order-confirmed', 'sent', 'seed', '2026-07-18T12:40:10Z', 'Thanks Amelia — order VC-0992 is confirmed.'
    );
insert into email_log (id, recipient, subject, template, status, provider, sent_at, preview) values (
      'email-2', 'henry@example.com', 'Your Vicarious order VC-1048', 'order-confirmed', 'sent', 'seed', '2026-08-14T18:20:10Z', 'Thanks Henry — order VC-1048 is confirmed.'
    );
insert into audit_logs (actor, action, detail, before, after, at) values (
      'Oliver', 'changed price', 'VC-000381', '£64.00', '£52.00', '2026-08-18T20:35:59.175Z'
    );
insert into audit_logs (actor, action, detail, before, after, at) values (
      'Henry', 'refunded order', 'VC-1048', '£64.00', null, '2026-08-19T20:35:59.175Z'
    );
insert into audit_logs (actor, action, detail, before, after, at) values (
      'Henry', 'marked dispatched', 'VC-1048', null, null, '2026-08-20T00:35:59.175Z'
    );
insert into audit_logs (actor, action, detail, before, after, at) values (
      'Henry', 'listed product', 'VC-000412 Supreme Box Logo Hoodie', null, null, '2026-08-19T14:35:59.175Z'
    );
