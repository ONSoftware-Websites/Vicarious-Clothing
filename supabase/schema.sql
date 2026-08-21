-- =================================================================
-- Vicarious Clothing — Supabase schema (Phase 2 swap-in)
-- Run this in the Supabase SQL editor after creating your project.
-- Mirrors src/lib/types.ts one-to-one and blueprint section 23.
-- =================================================================

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
create type condition_grade as enum (
  'new_with_tags', 'new_without_tags', 'excellent', 'very_good', 'good', 'fair'
);

create type inventory_status as enum (
  'DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'
);

create type order_status as enum (
  'PENDING_PAYMENT', 'PAID', 'PICKING', 'READY_TO_DISPATCH', 'DISPATCHED',
  'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'CANCELLED'
);

create type lead_status as enum (
  'NEW', 'REVIEWING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED',
  'RECEIVED', 'INSPECTED', 'PAID'
);

create type role_type as enum ('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'OWNER');

create type sales_channel as enum ('website', 'vinted', 'depop', 'ebay');

create type marketplace_status as enum ('LISTED', 'NOT_LISTED');

create type discount_type as enum ('percentage', 'fixed', 'free_delivery');

create type purchase_status as enum ('AGREED', 'PAID');

create type email_status as enum ('sent', 'logged');

-- ---------------------------------------------------------------
-- People (auth.users is managed by Supabase Auth)
-- ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role role_type not null default 'CUSTOMER',
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  postcode text not null,
  country text not null default 'United Kingdom'
);

create table marketing_consents (
  profile_id uuid primary key references profiles (id) on delete cascade,
  marketing boolean not null default false,
  consented_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Catalogue (brands/categories are the controlled vocabularies)
-- ---------------------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null
);

create table products (
  sku text primary key,
  slug text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  size text not null,
  colour text not null default '',
  material text not null default '',
  condition condition_grade not null,
  condition_notes text not null default '',
  description text not null default '',
  defects text[] not null default '{}',
  tags text[] not null default '{}',
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  cost numeric(10,2),
  floor_price numeric(10,2),
  is_pick boolean not null default false,
  featured boolean not null default false,
  listed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_sku text not null references products (sku) on delete cascade,
  position int not null default 0,
  src text not null,
  alt text
);

create table product_measurements (
  id uuid primary key default gen_random_uuid(),
  product_sku text not null references products (sku) on delete cascade,
  label text not null,
  value text not null
);

-- Marketplace listing status per product per channel (app: Product.marketplace)
create table product_marketplace (
  sku text not null references products (sku) on delete cascade,
  channel sales_channel not null,
  status marketplace_status not null default 'NOT_LISTED',
  primary key (sku, channel)
);

-- ---------------------------------------------------------------
-- Inventory (the physical unit — separate from the catalogue by design)
-- ---------------------------------------------------------------
create table inventory_locations (
  id text primary key,          -- e.g. 'A-04'
  label text
);

create table inventory_items (
  sku text primary key references products (sku) on delete cascade,
  status inventory_status not null default 'DRAFT',
  location_id text references inventory_locations (id),
  reserved_until timestamptz,
  sold_at timestamptz,
  acquisition_source text,
  purchase_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory_history (
  id uuid primary key default gen_random_uuid(),
  sku text not null references inventory_items (sku) on delete cascade,
  actor text not null,
  action text not null,
  detail text,
  before text,
  after text,
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------
create table orders (
  id text primary key,          -- VC-XXXX
  email text not null,
  name text not null,
  status order_status not null default 'PENDING_PAYMENT',
  subtotal numeric(10,2) not null,
  discount_code text,
  discount_type text,
  discount_description text,
  discount_amount numeric(10,2) not null default 0,
  delivery numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  channel sales_channel not null default 'website',
  address_line1 text not null,
  address_line2 text,
  address_city text not null,
  address_postcode text not null,
  address_country text not null default 'United Kingdom',
  payment_provider text not null default 'demo',
  payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  sku text references products (sku),
  name text not null,
  brand text not null,
  size text not null,
  condition condition_grade not null,
  price numeric(10,2) not null,
  image text
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  provider text not null default 'stripe',
  payment_intent_id text,
  amount numeric(10,2),
  status text,
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  carrier text,
  tracking text,
  dispatched_at timestamptz
);

create table returns (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  status text not null default 'REQUESTED',
  requested_at timestamptz not null default now(),
  received_at timestamptz
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders (id) on delete cascade,
  amount numeric(10,2),
  provider_refund_id text,
  issued_at timestamptz not null default now()
);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade
);

create table wishlist_items (
  wishlist_id uuid not null references wishlists (id) on delete cascade,
  sku text not null references products (sku) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (wishlist_id, sku)
);

create table discounts (
  id text primary key,          -- app-generated id (e.g. 'disc-…')
  code text not null unique,
  type discount_type not null,
  value numeric(10,2) not null default 0,
  description text not null default '',
  min_basket numeric(10,2),
  categories text[],
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  used_emails text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Acquisition (Sell To Us + stock purchases)
-- ---------------------------------------------------------------
create table purchase_leads (
  id text primary key,          -- app-generated id (e.g. 'lead-…')
  name text not null,
  email text not null,
  brand text not null,
  item_type text not null,
  size text not null,
  condition text not null,
  notes text,
  offer text,
  status lead_status not null default 'NEW',
  created_at timestamptz not null default now()
);

create table stock_purchases (
  id text primary key,          -- app-generated id (e.g. 'pur-…')
  seller_name text not null,
  seller_email text not null default '',
  amount numeric(10,2) not null,
  status purchase_status not null default 'AGREED',
  notes text,
  lead_id text references purchase_leads (id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table stock_purchase_items (
  purchase_id text not null references stock_purchases (id) on delete cascade,
  sku text not null,
  name text not null default '',
  brand text not null default '',
  cost numeric(10,2) not null default 0,
  primary key (purchase_id, sku)
);

-- ---------------------------------------------------------------
-- Marketing / content / telemetry
-- ---------------------------------------------------------------
create table newsletter_subscribers (
  email text primary key,
  source text not null default 'website',
  consented_at timestamptz not null default now()
);

create table journal_posts (
  id text primary key,          -- app-generated id (e.g. 'post-…')
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text[] not null default '{}',
  cover_image text,
  published boolean not null default false,
  published_at timestamptz not null default now()
);

create table email_log (
  id text primary key,          -- app-generated id (e.g. 'email-…')
  recipient text not null,
  subject text not null,
  template text not null,
  status email_status not null,
  provider text not null default 'resend',
  sent_at timestamptz not null default now(),
  preview text not null default ''
);

create table visits (
  day date primary key,
  count int not null default 0
);

-- ---------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  detail text,
  before text,
  after text,
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table marketing_consents enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_measurements enable row level security;
alter table product_marketplace enable row level security;
alter table inventory_locations enable row level security;
alter table inventory_items enable row level security;
alter table inventory_history enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table shipments enable row level security;
alter table returns enable row level security;
alter table refunds enable row level security;
alter table wishlists enable row level security;
alter table wishlist_items enable row level security;
alter table discounts enable row level security;
alter table purchase_leads enable row level security;
alter table stock_purchases enable row level security;
alter table stock_purchase_items enable row level security;
alter table newsletter_subscribers enable row level security;
alter table journal_posts enable row level security;
alter table email_log enable row level security;
alter table visits enable row level security;
alter table audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('STAFF', 'MANAGER', 'ADMIN', 'OWNER')
  );
$$;

-- Public: catalogue, brand/category vocabularies, published journal posts
create policy "brands public read" on brands
  for select using (true);
create policy "brands admin write" on brands
  for all using (public.is_admin()) with check (public.is_admin());

create policy "categories public read" on categories
  for select using (true);
create policy "categories admin write" on categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products public read" on products
  for select using (true);
create policy "products admin write" on products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "images public read" on product_images
  for select using (true);
create policy "images admin write" on product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "measurements public read" on product_measurements
  for select using (true);
create policy "measurements admin write" on product_measurements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "marketplace public read" on product_marketplace
  for select using (true);
create policy "marketplace admin write" on product_marketplace
  for all using (public.is_admin()) with check (public.is_admin());

create policy "journal public read" on journal_posts
  for select using (published = true);
create policy "journal admin write" on journal_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Customers: their own data only
create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own addresses" on addresses for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own consents" on marketing_consents for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own wishlists" on wishlists for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own wishlist items" on wishlist_items for all
  using (
    wishlist_id in (select id from wishlists where profile_id = auth.uid())
  )
  with check (
    wishlist_id in (select id from wishlists where profile_id = auth.uid())
  );

-- Admin-only: commerce, inventory, acquisition, marketing, audit
create policy "orders admin only" on orders for all
  using (public.is_admin());
create policy "order items admin only" on order_items for all
  using (public.is_admin());
create policy "payments admin only" on payments for all
  using (public.is_admin());
create policy "shipments admin only" on shipments for all
  using (public.is_admin());
create policy "returns admin only" on returns for all
  using (public.is_admin());
create policy "refunds admin only" on refunds for all
  using (public.is_admin());
create policy "discounts admin only" on discounts for all
  using (public.is_admin()) with check (public.is_admin());
create policy "leads admin only" on purchase_leads for all
  using (public.is_admin()) with check (public.is_admin());
create policy "purchases admin only" on stock_purchases for all
  using (public.is_admin()) with check (public.is_admin());
create policy "purchase items admin only" on stock_purchase_items for all
  using (public.is_admin()) with check (public.is_admin());
create policy "subscribers admin only" on newsletter_subscribers for all
  using (public.is_admin()) with check (public.is_admin());
create policy "email log admin only" on email_log for all
  using (public.is_admin()) with check (public.is_admin());
create policy "visits admin only" on visits for all
  using (public.is_admin()) with check (public.is_admin());
create policy "inventory admin only" on inventory_items for all
  using (public.is_admin());
create policy "inventory history admin only" on inventory_history for all
  using (public.is_admin());
create policy "locations admin only" on inventory_locations for all
  using (public.is_admin()) with check (public.is_admin());
create policy "audit log admin only" on audit_logs for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- Useful indexes
-- ---------------------------------------------------------------
create index on products (brand);
create index on products (category);
create index on products (listed_at desc);
create index on orders (created_at desc);
create index on orders (email);
create index on order_items (order_id);
create index on product_marketplace (sku);
create index on payments (order_id);
create index on shipments (order_id);
create index on returns (order_id);
create index on refunds (order_id);
create index on audit_logs (at desc);
create index on inventory_items (status);
create index on inventory_history (sku);
create index on purchase_leads (status);
create index on stock_purchases (created_at desc);
create index on newsletter_subscribers (consented_at desc);
create index on journal_posts (published_at desc);
create index on email_log (sent_at desc);
