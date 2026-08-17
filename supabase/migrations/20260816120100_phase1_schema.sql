-- Phase 1: Firebase -> Supabase migration
-- Schema for the 11 config/lookup collections + admin role table.
-- charlotteFabrics / charlotteFabricsSyncRuns / sampleRequests are Phase 2 and
-- intentionally NOT created here.

-- ---------------------------------------------------------------------------
-- shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_sort_order on categories (sort_order);
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- foam
-- ---------------------------------------------------------------------------
create table foam (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text,
  image_url text,
  svg_id text,
  custom_svg_content text,
  dimensions jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_foam_category_sort on foam (category_id, sort_order);
create trigger trg_foam_updated_at before update on foam
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- foam_grades
-- ---------------------------------------------------------------------------
create table foam_grades (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  brand text not null,
  grade_name text not null,
  price numeric(10,2) not null default 0,
  density text,
  firmness text,
  warranty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_foam_grades_brand_grade on foam_grades (brand, grade_name);
create trigger trg_foam_grades_updated_at before update on foam_grades
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- dimension_rules
-- ---------------------------------------------------------------------------
create table dimension_rules (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  dimension_type text not null check (dimension_type in ('width','depth','thickness')),
  allow_fractions boolean not null default false,
  min_value numeric,
  max_value numeric,
  max_block_length numeric,
  ranges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_dimension_rules_type on dimension_rules (dimension_type);
create trigger trg_dimension_rules_updated_at before update on dimension_rules
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fibre_wrap
-- ---------------------------------------------------------------------------
create table fibre_wrap (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  fibre_thickness text not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_fibre_wrap_thickness on fibre_wrap (fibre_thickness);
create trigger trg_fibre_wrap_updated_at before update on fibre_wrap
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- bench_cushions (+ variables + options)
-- ---------------------------------------------------------------------------
create table bench_cushions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  description text,
  images text[] not null default '{}',
  dimensions jsonb not null default '[]'::jsonb,
  base_price numeric(10,2) not null default 0,
  currency text not null default 'usd',
  estimated_yards numeric(10,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bench_cushions_sort_order on bench_cushions (sort_order);
create trigger trg_bench_cushions_updated_at before update on bench_cushions
  for each row execute function set_updated_at();

create table bench_cushion_variables (
  id uuid primary key default gen_random_uuid(),
  bench_cushion_id uuid not null references bench_cushions(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_bcv_cushion_sort on bench_cushion_variables (bench_cushion_id, sort_order);

create table bench_cushion_variable_options (
  id uuid primary key default gen_random_uuid(),
  variable_id uuid not null references bench_cushion_variables(id) on delete cascade,
  label text not null,
  price_modifier numeric(10,2) not null default 0,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_bcvo_variable_sort on bench_cushion_variable_options (variable_id, sort_order);

-- Atomic parent+children upsert, since supabase-js has no client-side transaction API.
-- Runs SECURITY INVOKER (default) so RLS on all three tables still applies to the caller.
create or replace function upsert_bench_cushion_style(style jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_variable jsonb;
  v_variable_id uuid;
  v_option jsonb;
begin
  v_id := nullif(style->>'id', '')::uuid;

  if v_id is null then
    insert into bench_cushions (
      legacy_id, name, description, images, dimensions,
      base_price, currency, estimated_yards, sort_order
    ) values (
      nullif(style->>'legacy_id', ''),
      style->>'name',
      style->>'description',
      coalesce(
        (select array_agg(value) from jsonb_array_elements_text(coalesce(style->'images', '[]'::jsonb))),
        '{}'
      ),
      coalesce(style->'dimensions', '[]'::jsonb),
      coalesce((style->>'base_price')::numeric, 0),
      coalesce(style->>'currency', 'usd'),
      coalesce((style->>'estimated_yards')::numeric, 0),
      coalesce((style->>'sort_order')::integer, 0)
    )
    returning id into v_id;
  else
    update bench_cushions set
      name = style->>'name',
      description = style->>'description',
      images = coalesce(
        (select array_agg(value) from jsonb_array_elements_text(coalesce(style->'images', '[]'::jsonb))),
        '{}'
      ),
      dimensions = coalesce(style->'dimensions', '[]'::jsonb),
      base_price = coalesce((style->>'base_price')::numeric, 0),
      currency = coalesce(style->>'currency', 'usd'),
      estimated_yards = coalesce((style->>'estimated_yards')::numeric, 0),
      sort_order = coalesce((style->>'sort_order')::integer, 0)
    where id = v_id;
  end if;

  delete from bench_cushion_variables where bench_cushion_id = v_id;

  for v_variable in select * from jsonb_array_elements(coalesce(style->'variables', '[]'::jsonb))
  loop
    insert into bench_cushion_variables (bench_cushion_id, name, sort_order)
    values (v_id, v_variable->>'name', coalesce((v_variable->>'sort_order')::integer, 0))
    returning id into v_variable_id;

    for v_option in select * from jsonb_array_elements(coalesce(v_variable->'options', '[]'::jsonb))
    loop
      insert into bench_cushion_variable_options (variable_id, label, price_modifier, image_url, sort_order)
      values (
        v_variable_id,
        v_option->>'label',
        coalesce((v_option->>'price_modifier')::numeric, 0),
        nullif(v_option->>'image_url', ''),
        coalesce((v_option->>'sort_order')::integer, 0)
      );
    end loop;
  end loop;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- fabric_price_tags
-- ---------------------------------------------------------------------------
create table fabric_price_tags (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  price_per_yard numeric(10,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_fabric_price_tags_updated_at before update on fabric_price_tags
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fabric_groups
-- ---------------------------------------------------------------------------
create table fabric_groups (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_fabric_groups_updated_at before update on fabric_groups
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fabric_price_ranges
-- ---------------------------------------------------------------------------
create table fabric_price_ranges (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  min_price numeric(10,2) not null,
  max_price numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_price is null or max_price >= min_price)
);
create trigger trg_fabric_price_ranges_updated_at before update on fabric_price_ranges
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fabric_price_tiers (+ materials)
-- ---------------------------------------------------------------------------
create table fabric_price_tiers (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  price_per_yard numeric(10,2) not null default 0,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_fabric_price_tiers_updated_at before update on fabric_price_tiers
  for each row execute function set_updated_at();

create table fabric_price_tier_materials (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references fabric_price_tiers(id) on delete cascade,
  material_slug text not null,
  unique (tier_id, material_slug)
);
create index idx_fptm_tier on fabric_price_tier_materials (tier_id);

-- ---------------------------------------------------------------------------
-- products (legacy/generic catalog)
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft','active')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- admin_users
-- No insert/update/delete policy is defined for this table anywhere (see the
-- RLS migration) -- the only way to grant admin is running SQL by hand in the
-- Supabase SQL editor via supabase/sql/assign_admin.sql, on purpose.
-- ---------------------------------------------------------------------------
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
