-- Vicarious Clothing — Supabase schema (Phase 2 swap-in)
-- Run this in the Supabase SQL editor after creating your project.
-- Mirrors src/lib/types.ts and blueprint section 23 (Data Model).

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------
create type condition_grade as enum (
  'new_with_tags', 'new_without_tags', 'excellent', 'very_good', 'good', 'fair'
);
create type inventory_status as enum ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED');
create type order_status as enum (
  'PENDING_PAYMENT', 'PAID', 'PICKING', 'READY_TO_DISPATCH', 'DISPATCHED',
  'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'CANCELLED'
);
create type lead_status as enum (
  'NEW', 'REVIEWING', 'OFFER_SENT', 'ACCEPTED', 'DECLINED', 'RECEIVED', 'INSPECTED', 'PAID'
);
create type role_type as enum ('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'OWNER');
create type sales_channel as enum ('website', 'vinted', 'depop', 'ebay');
create type marketplace_status as enum ('LISTED', 'NOT_LISTED');
create type discount_type as enum ('percentage', 'fixed', 'free_delivery');

-- ---------------------------------------------------------------
-- People
-- ---------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role role_type not null default 'CUSTOMER',
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete cascade,
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

-- ---------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
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
  brand_id uuid references brands (id),
  category text not null,
  size text not null,
  colour text,
  material text,
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
  product_sku text references products (sku) on delete cascade,
  position int not null default 0,
  src text not null,
  alt text
);

create table product_measurements (
  id uuid primary key default gen_random_uuid(),
  product_sku text references products (sku) on delete cascade,
  label text not null,
  value text not null
);

-- ---------------------------------------------------------------
-- Inventory (the physical unit — separate from catalogue by design)
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
  sku text references inventory_items (sku) on delete cascade,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders (id) on delete cascade,
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
  order_id text references orders (id) on delete cascade,
  provider text not null default 'stripe',
  payment_intent_id text,
  amount numeric(10,2),
  status text,
  created_at timestamptz not null default now()
);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders (id) on delete cascade,
  carrier text,
  tracking text,
  dispatched_at timestamptz
);

create table returns (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders (id) on delete cascade,
  status text not null default 'REQUESTED',
  requested_at timestamptz not null default now(),
  received_at timestamptz
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders (id) on delete cascade,
  amount numeric(10,2),
  provider_refund_id text,
  issued_at timestamptz not null default now()
);

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete cascade
);

create table wishlist_items (
  wishlist_id uuid references wishlists (id) on delete cascade,
  sku text references products (sku) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (wishlist_id, sku)
);

create table discounts (
  id uuid primary key default gen_random_uuid(),
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
-- Acquisition (Sell To Us)
-- ---------------------------------------------------------------
create table sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table purchase_leads (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers (id),
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
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers (id),
  status text not null default 'AGREED',
  agreed_amount numeric(10,2),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table stock_purchase_items (
  purchase_id uuid references stock_purchases (id) on delete cascade,
  sku text references products (sku),
  expected_cost numeric(10,2),
  primary key (purchase_id, sku)
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
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_measurements enable row level security;
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
alter table audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('STAFF', 'MANAGER', 'ADMIN', 'OWNER')
  );
$$;

-- Public catalogue: anyone can read, only admin can write
create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all
  using (public.is_admin()) with check (public.is_admin());
create policy "public read images" on product_images for select using (true);
create policy "admin write images" on product_images for all
  using (public.is_admin()) with check (public.is_admin());
create policy "public read measurements" on product_measurements for select using (true);
create policy "admin write measurements" on product_measurements for all
  using (public.is_admin()) with check (public.is_admin());

-- Orders: server-side (service role) only — never expose directly to customers
create policy "orders service only" on orders for all
  using (public.is_admin());
create policy "order items service only" on order_items for all
  using (public.is_admin());
create policy "payments service only" on payments for all
  using (public.is_admin());
create policy "shipments service only" on shipments for all
  using (public.is_admin());
create policy "returns service only" on returns for all
  using (public.is_admin());
create policy "refunds service only" on refunds for all
  using (public.is_admin());
create policy "leads service only" on purchase_leads for all
  using (public.is_admin());
create policy "audit admin only" on audit_logs for select using (public.is_admin());
create policy "discounts admin only" on discounts for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles: own data only
create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own addresses" on addresses for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own consents" on marketing_consents for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own wishlists" on wishlists for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own wishlist items" on wishlist_items for all
  using (wishlist_id in (select id from wishlists where profile_id = auth.uid()));

-- ---------------------------------------------------------------
-- Useful indexes
-- ---------------------------------------------------------------
create index on products (status);
create index on products (category);
create index on products (listed_at desc);
create index on orders (created_at desc);
create index on orders (email);
create index on audit_logs (at desc);
create index on inventory_items (status);
