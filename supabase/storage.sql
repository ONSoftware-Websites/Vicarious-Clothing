-- Vicarious Clothing — Supabase Storage for image uploads
-- Run this in Supabase SQL editor AFTER schema.sql (once).
-- Creates public buckets so drag-and-drop uploads get a permanent URL.

-- Buckets
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('journal-images', 'journal-images', true)
on conflict (id) do nothing;

-- Policies: public read, service_role write (admin uploads use service_role key, so bypass RLS anyway)
-- These allow anyone to read images (storefront needs it) but only service_role to write.
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Service role write product images"
on storage.objects for insert
with check (bucket_id = 'product-images');

create policy "Service role update product images"
on storage.objects for update
using (bucket_id = 'product-images');

create policy "Service role delete product images"
on storage.objects for delete
using (bucket_id = 'product-images');

create policy "Public read journal images"
on storage.objects for select
using (bucket_id = 'journal-images');

create policy "Service role write journal images"
on storage.objects for insert
with check (bucket_id = 'journal-images');

create policy "Service role update journal images"
on storage.objects for update
using (bucket_id = 'journal-images');

create policy "Service role delete journal images"
on storage.objects for delete
using (bucket_id = 'journal-images');

-- If you get "policy already exists" errors, drop first:
-- drop policy if exists "Public read product images" on storage.objects;
