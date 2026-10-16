create unique index if not exists stock_purchase_item_unique_sku_per_purchase
on public.stock_purchase_items(purchase_id,sku);
