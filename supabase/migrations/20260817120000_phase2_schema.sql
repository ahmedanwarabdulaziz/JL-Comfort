-- Phase 2: Firebase -> Supabase migration
-- Schema for charlotteFabrics, charlotteFabricsSyncRuns, sampleRequests.
-- Reuses set_updated_at() defined in the Phase 1 schema migration.

-- ---------------------------------------------------------------------------
-- charlotte_fabrics
-- ---------------------------------------------------------------------------
create table charlotte_fabrics (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique not null, -- old Firestore slug doc id, e.g. "d5087-navy"; also the /fabrics/[slug] lookup key
  name text not null,
  sku text not null,
  product_url text not null,
  image_url text not null default '',
  image_ok boolean not null default true,
  color text[] not null default '{}',
  pattern text[] not null default '{}',
  material text[] not null default '{}',
  applications text[] not null default '{}',
  markets text[] not null default '{}',
  fiber_content text,
  durability text,
  width text,
  repeat text,
  pattern_direction text,
  cleanability text,
  flammability text,
  origin text,
  features text,
  performance text,
  specs jsonb not null default '{}'::jsonb,
  availability text not null default 'InStock' check (availability in ('InStock', 'OutOfStock')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  price_tag_id uuid references fabric_price_tags(id) on delete set null,
  cost_price numeric(10,2),
  map_price numeric(10,2),
  retail_price numeric(10,2),
  colorway_group text,
  brand text,
  sample_books text[] not null default '{}',
  eco_friendly text[] not null default '{}',
  construction_type text[] not null default '{}',
  properties text[] not null default '{}',
  is_new boolean not null default false,
  master_spreadsheet_imported_at timestamptz,
  manual_retail_price numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_charlotte_fabrics_status on charlotte_fabrics (status);
create index idx_charlotte_fabrics_sku on charlotte_fabrics (sku);
create index idx_charlotte_fabrics_price_tag on charlotte_fabrics (price_tag_id);
create index idx_charlotte_fabrics_colorway_group on charlotte_fabrics (colorway_group) where colorway_group is not null;
create index idx_charlotte_fabrics_color_gin on charlotte_fabrics using gin (color);
create index idx_charlotte_fabrics_pattern_gin on charlotte_fabrics using gin (pattern);
create index idx_charlotte_fabrics_material_gin on charlotte_fabrics using gin (material);
create index idx_charlotte_fabrics_applications_gin on charlotte_fabrics using gin (applications);
create index idx_charlotte_fabrics_markets_gin on charlotte_fabrics using gin (markets);
create trigger trg_charlotte_fabrics_updated_at before update on charlotte_fabrics
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fabric_group_members (replaces charlotteFabrics.groupIds[])
-- ---------------------------------------------------------------------------
create table fabric_group_members (
  fabric_id uuid not null references charlotte_fabrics(id) on delete cascade,
  group_id uuid not null references fabric_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (fabric_id, group_id)
);
create index idx_fgm_group on fabric_group_members (group_id);

-- ---------------------------------------------------------------------------
-- charlotte_fabric_sync_runs (crawler job-status log; totals flattened to
-- columns rather than a nested jsonb, matching the rest of the schema)
-- ---------------------------------------------------------------------------
create table charlotte_fabric_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  last_updated_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  phase text not null default 'discovering-catalog',
  discovered integer not null default 0,
  scanned integer not null default 0,
  added integer not null default 0,
  updated integer not null default 0,
  deactivated integer not null default 0,
  broken_images integer not null default 0,
  errors integer not null default 0,
  structural_warnings integer not null default 0,
  error_log text[] not null default '{}'
);
create index idx_sync_runs_started_at on charlotte_fabric_sync_runs (started_at desc);

-- Enable Supabase Realtime for the admin dashboard's live sync-progress panel
-- (replaces Firestore's onSnapshot listener).
alter publication supabase_realtime add table charlotte_fabric_sync_runs;

-- ---------------------------------------------------------------------------
-- sample_requests / sample_request_items
-- Address fields flattened to columns (matching the rest of this schema);
-- fabric_id is an intentionally nullable soft FK -- these rows are a
-- denormalized snapshot taken at request time, not a live join, so a fabric
-- being later deactivated or re-migrated must never break historical records.
-- ---------------------------------------------------------------------------
create table sample_requests (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  email text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  address_city text not null,
  address_state text not null,
  address_zip text not null,
  address_country text not null,
  status text not null default 'pending' check (status in ('pending', 'shipped')),
  created_at timestamptz not null default now()
);
create index idx_sample_requests_created_at on sample_requests (created_at desc);

create table sample_request_items (
  id uuid primary key default gen_random_uuid(),
  sample_request_id uuid not null references sample_requests(id) on delete cascade,
  fabric_id uuid references charlotte_fabrics(id) on delete set null,
  name text not null,
  sku text not null,
  image_url text not null default '',
  sort_order integer not null default 0
);
create index idx_sri_request on sample_request_items (sample_request_id);
