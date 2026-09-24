-- Sample requests get the same fulfilment flow as fabric orders: a request number, automatic emails
-- (supplier / customer / internal), statuses, supplier references, tracking and a history log.
-- Plus admin-set limits on how many samples one customer can request.
-- Reuses set_updated_at() defined in the Phase 1 schema migration.

-- ---------------------------------------------------------------------------
-- sample_requests: new columns + wider status set
--   pending (not sent to supplier yet) -> sent_to_supplier -> shipped -> delivered
--   plus cancelled, problem.
-- ---------------------------------------------------------------------------
create sequence sample_request_number_seq start 1001;

alter table sample_requests
  add column request_number text unique not null default ('S-' || nextval('sample_request_number_seq')),
  add column supplier_order_number text,
  add column supplier_invoice_number text,
  add column carrier text,
  add column tracking_number text,
  add column tracking_url text,
  add column supplier_emailed_at timestamptz,
  add column shipped_at timestamptz,
  add column delivered_at timestamptz,
  add column updated_at timestamptz not null default now();

alter table sample_requests drop constraint if exists sample_requests_status_check;
alter table sample_requests add constraint sample_requests_status_check
  check (status in ('pending', 'sent_to_supplier', 'shipped', 'delivered', 'cancelled', 'problem'));

create trigger sample_requests_set_updated_at before update on sample_requests
  for each row execute function set_updated_at();

-- Used by the per-customer limit check (same email, or same street address + postal code).
create index idx_sample_requests_email on sample_requests (lower(email), created_at desc);
create index idx_sample_requests_address on sample_requests (lower(address_zip), created_at desc);

-- History per request: emails sent/failed, status changes, tracking added.
create table sample_request_events (
  id uuid primary key default gen_random_uuid(),
  sample_request_id uuid not null references sample_requests(id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index idx_sample_request_events_request on sample_request_events (sample_request_id, created_at);

alter table sample_request_events enable row level security;
create policy sample_request_events_admin_read on sample_request_events for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- sample_settings: a single row (id is always true). Public read -- the storefront shows the
-- limits -- admin-only write. Enforced server-side in /api/fabric-samples/request.
-- ---------------------------------------------------------------------------
create table sample_settings (
  id boolean primary key default true check (id),
  requests_enabled boolean not null default true,
  max_per_request integer not null default 5 check (max_per_request between 1 and 50),
  max_per_customer integer not null default 10 check (max_per_customer between 1 and 500),
  period_days integer not null default 30 check (period_days between 1 and 3650),
  updated_at timestamptz not null default now()
);
create trigger sample_settings_set_updated_at before update on sample_settings
  for each row execute function set_updated_at();

alter table sample_settings enable row level security;
create policy sample_settings_public_read on sample_settings for select using (true);
create policy sample_settings_admin_insert on sample_settings for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy sample_settings_admin_update on sample_settings for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

insert into sample_settings default values;

-- Optional separate supplier address for sample requests; blank = use supplier_email.
alter table email_settings add column supplier_sample_email text;
