-- Discounts, Shopify-style: a discount is either entered as a code or applied automatically, takes
-- a % / fixed CAD / free-shipping value, can be limited to part of the catalog, needs an optional
-- minimum, has usage limits and an active window. Codes live in their own table so one discount
-- can have many codes (e.g. 100 generated single-use codes that start with a prefix).
-- Admin-only (codes are secret); checkout and the Stripe webhook use the service role.

create table discounts (
  id uuid primary key default gen_random_uuid(),
  title text not null, -- internal name, also shown to the customer (e.g. "Spring sale")
  method text not null check (method in ('code', 'automatic')),
  type text not null check (type in ('percentage', 'fixed_amount', 'free_shipping')),
  value numeric(10,2) not null default 0 check (value >= 0), -- percent (15 = 15%) or CAD amount
  applies_to text not null default 'all' check (applies_to in ('all', 'fabric', 'foam', 'bench_cushion', 'sample_books')),
  applies_to_books text[] not null default '{}', -- when applies_to = 'sample_books'
  min_subtotal numeric(10,2) check (min_subtotal is null or min_subtotal >= 0), -- CAD, eligible items
  min_yards integer check (min_yards is null or min_yards > 0), -- fabric yards in the order
  usage_limit integer check (usage_limit is null or usage_limit > 0), -- total paid orders, all codes
  once_per_customer boolean not null default false, -- by customer email
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'percentage' or value <= 100),
  check (ends_at is null or ends_at > starts_at)
);
create trigger discounts_set_updated_at before update on discounts
  for each row execute function set_updated_at();

create table discount_codes (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references discounts(id) on delete cascade,
  code text not null check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,40}$'),
  usage_limit integer check (usage_limit is null or usage_limit > 0), -- e.g. 1 for generated single-use codes
  created_at timestamptz not null default now()
);
create unique index idx_discount_codes_code on discount_codes (code);
create index idx_discount_codes_discount on discount_codes (discount_id);

-- One row per paid order that used a discount. Written by the Stripe webhook, so a discount's
-- usage only counts orders that were actually paid.
create table discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references discounts(id) on delete cascade,
  code_id uuid references discount_codes(id) on delete set null,
  order_id uuid not null unique references orders(id) on delete cascade,
  customer_email text not null,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);
create index idx_discount_redemptions_discount on discount_redemptions (discount_id);
create index idx_discount_redemptions_code on discount_redemptions (code_id);
create index idx_discount_redemptions_email on discount_redemptions (discount_id, lower(customer_email));

alter table discounts enable row level security;
alter table discount_codes enable row level security;
alter table discount_redemptions enable row level security;

create policy discounts_admin_all on discounts for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy discount_codes_admin_all on discount_codes for all
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy discount_redemptions_admin_read on discount_redemptions for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- The discount an order was placed with (snapshot: later edits to the discount don't change it).
alter table orders
  add column discount_id uuid references discounts(id) on delete set null,
  add column discount_code_id uuid references discount_codes(id) on delete set null,
  add column discount_label text, -- e.g. "SPRING15" or "Spring sale"
  add column discount_cents integer not null default 0;
