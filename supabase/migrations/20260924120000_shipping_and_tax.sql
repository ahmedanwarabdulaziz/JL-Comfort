-- Shipping rates + sales tax rates, both editable from the admin panel
-- (/admin/shipping and /admin/taxes) and read by /api/checkout.
-- Reuses set_updated_at() defined in the Phase 1 schema migration.

-- ---------------------------------------------------------------------------
-- shipping_rates: one row per destination country we ship to. A country with
-- no row (or enabled = false) cannot check out.
--
--   * fabric_order_fee is charged once per order when the cart contains any
--     fabric or vinyl, then fabric_per_yard / vinyl_per_yard are added per yard
--     (mirrors the Charlotte Fabrics freight: flat fee + per-yard).
--   * foam_per_item / bench_cushion_per_item are charged per unit ordered.
--   * free_shipping_over: order subtotal at/above which shipping is $0; null = never.
-- ---------------------------------------------------------------------------
create table shipping_rates (
  country text primary key check (country ~ '^[A-Z]{2}$'),
  enabled boolean not null default true,
  fabric_order_fee numeric(10,2) not null default 0 check (fabric_order_fee >= 0),
  fabric_per_yard numeric(10,2) not null default 0 check (fabric_per_yard >= 0),
  vinyl_per_yard numeric(10,2) not null default 0 check (vinyl_per_yard >= 0),
  foam_per_item numeric(10,2) not null default 0 check (foam_per_item >= 0),
  bench_cushion_per_item numeric(10,2) not null default 0 check (bench_cushion_per_item >= 0),
  free_shipping_over numeric(10,2) check (free_shipping_over is null or free_shipping_over >= 0),
  delivery_min_days integer not null default 3 check (delivery_min_days >= 0),
  delivery_max_days integer not null default 7 check (delivery_max_days >= delivery_min_days),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shipping_rates_set_updated_at before update on shipping_rates
  for each row execute function set_updated_at();

alter table shipping_rates enable row level security;
create policy shipping_rates_public_read on shipping_rates for select using (true);
create policy shipping_rates_admin_insert on shipping_rates for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy shipping_rates_admin_update on shipping_rates for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy shipping_rates_admin_delete on shipping_rates for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

insert into shipping_rates (country, fabric_order_fee, fabric_per_yard, vinyl_per_yard)
values ('CA', 30, 2, 4);

-- ---------------------------------------------------------------------------
-- tax_rates: one row per tax *component* per region, so a region can stack
-- several (e.g. BC = GST 5% + PST 7%). country + region_code use ISO codes
-- (CA/ON, US/NY, ...), which is also what Stripe expects on its TaxRate objects.
-- rate is a percentage (13 = 13%). Only enabled rows are charged.
-- ---------------------------------------------------------------------------
create table tax_rates (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country ~ '^[A-Z]{2}$'),
  region_code text not null,
  region_name text not null,
  tax_name text not null,
  rate numeric(6,3) not null check (rate >= 0 and rate < 100),
  applies_to_shipping boolean not null default true,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country, region_code, tax_name)
);
create index idx_tax_rates_region on tax_rates (country, region_code);
create trigger tax_rates_set_updated_at before update on tax_rates
  for each row execute function set_updated_at();

alter table tax_rates enable row level security;
create policy tax_rates_public_read on tax_rates for select using (true);
create policy tax_rates_admin_insert on tax_rates for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy tax_rates_admin_update on tax_rates for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy tax_rates_admin_delete on tax_rates for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- Canadian rates as of 2026. GST/HST is on by default. The provincial sales
-- taxes (BC/MB/SK PST, QC QST) are seeded *disabled*: a business only collects
-- those once it has registered with that province -- turn each one on in the
-- admin panel after registering.
insert into tax_rates (country, region_code, region_name, tax_name, rate, enabled, sort_order) values
  ('CA', 'AB', 'Alberta',                   'GST',  5,     true,  10),
  ('CA', 'BC', 'British Columbia',          'GST',  5,     true,  20),
  ('CA', 'BC', 'British Columbia',          'PST',  7,     false, 21),
  ('CA', 'MB', 'Manitoba',                  'GST',  5,     true,  30),
  ('CA', 'MB', 'Manitoba',                  'RST',  7,     false, 31),
  ('CA', 'NB', 'New Brunswick',             'HST',  15,    true,  40),
  ('CA', 'NL', 'Newfoundland and Labrador', 'HST',  15,    true,  50),
  ('CA', 'NS', 'Nova Scotia',               'HST',  14,    true,  60),
  ('CA', 'NT', 'Northwest Territories',     'GST',  5,     true,  70),
  ('CA', 'NU', 'Nunavut',                   'GST',  5,     true,  80),
  ('CA', 'ON', 'Ontario',                   'HST',  13,    true,  90),
  ('CA', 'PE', 'Prince Edward Island',      'HST',  15,    true,  100),
  ('CA', 'QC', 'Quebec',                    'GST',  5,     true,  110),
  ('CA', 'QC', 'Quebec',                    'QST',  9.975, false, 111),
  ('CA', 'SK', 'Saskatchewan',              'GST',  5,     true,  120),
  ('CA', 'SK', 'Saskatchewan',              'PST',  6,     false, 121),
  ('CA', 'YT', 'Yukon',                     'GST',  5,     true,  130);
