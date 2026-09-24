-- Orders (created at checkout, confirmed by the Stripe webhook) + the email settings used to send
-- the supplier purchase order and customer notifications. Admin-only: nothing here is public.
-- The checkout route and Stripe webhook write with the service-role key (bypasses RLS).
-- Reuses set_updated_at() defined in the Phase 1 schema migration.

-- ---------------------------------------------------------------------------
-- email_settings: a single row (id is always true).
-- ---------------------------------------------------------------------------
create table email_settings (
  id boolean primary key default true check (id),
  from_name text not null default 'JL Comfort',
  from_email text not null default 'orders@jlcomfort.com',
  reply_to text,
  internal_email text, -- receives a copy of every new order
  supplier_name text not null default 'Charlotte Fabrics',
  supplier_email text, -- purchase orders go here; blank = don't send POs
  supplier_account_number text,
  supplier_notes text, -- printed on every purchase order, e.g. "Blind ship"
  updated_at timestamptz not null default now()
);
create trigger email_settings_set_updated_at before update on email_settings
  for each row execute function set_updated_at();

alter table email_settings enable row level security;
create policy email_settings_admin_read on email_settings for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy email_settings_admin_insert on email_settings for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy email_settings_admin_update on email_settings for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

insert into email_settings (reply_to, internal_email, supplier_notes)
values (
  'jl@jlupholstery.com',
  'jl@jlupholstery.com',
  'Please blind ship: no invoice or pricing in the package. Ship directly to the customer address above.'
);

-- ---------------------------------------------------------------------------
-- orders
--   pending_payment -> paid -> sent_to_supplier -> shipped -> delivered -> closed
--   plus expired (checkout abandoned), cancelled, problem.
-- ---------------------------------------------------------------------------
create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('JL-' || nextval('order_number_seq')),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'sent_to_supplier', 'shipped', 'delivered', 'closed', 'expired', 'cancelled', 'problem'
  )),
  currency text not null default 'cad',
  subtotal_cents integer not null,
  shipping_cents integer not null,
  tax_cents integer not null,
  total_cents integer not null,
  taxes jsonb not null default '[]'::jsonb, -- [{label, amountCents}] as quoted
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  ship_line1 text not null,
  ship_line2 text,
  ship_city text not null,
  ship_region text not null,
  ship_postal_code text not null,
  ship_country text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  carrier text,
  tracking_number text,
  tracking_url text,
  paid_at timestamptz,
  supplier_emailed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_status on orders (status);
create index idx_orders_created_at on orders (created_at desc);
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_type text not null check (item_type in ('fabric', 'vinyl', 'foam', 'benchCushion')),
  fulfilled_by text not null check (fulfilled_by in ('supplier', 'workshop')),
  fabric_id uuid references charlotte_fabrics(id) on delete set null,
  sku text,
  name text not null,
  description text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  amount_cents integer not null,
  sort_order integer not null default 0
);
create index idx_order_items_order on order_items (order_id);

-- An append-only history per order: emails sent/failed, status changes, tracking added.
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index idx_order_events_order on order_events (order_id, created_at);

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;

create policy orders_admin_read on orders for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy orders_admin_update on orders for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy order_items_admin_read on order_items for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy order_events_admin_read on order_events for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy order_events_admin_insert on order_events for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
