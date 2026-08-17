-- Phase 1: Firebase -> Supabase migration
-- RLS: public read (matches today's Firestore "allow read: if true"), writes
-- require admin_users membership (the actual gap-fix vs. today's Firestore
-- rules, which only checked "is this any authenticated user").

-- ---------------------------------------------------------------------------
-- admin_users: self-read only. No insert/update/delete policy at all -- the
-- table can only be written by a user running SQL directly (service_role /
-- SQL editor bypasses RLS by design), matching the "I run all SQL myself"
-- workflow. This is intentional, not an oversight.
-- ---------------------------------------------------------------------------
alter table admin_users enable row level security;
create policy admin_users_self_read on admin_users
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reusable pattern applied to every content table below:
--   * anyone (including anonymous) can select
--   * insert/update/delete require the caller to be present in admin_users
-- ---------------------------------------------------------------------------

-- categories
alter table categories enable row level security;
create policy categories_public_read on categories for select using (true);
create policy categories_admin_insert on categories for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy categories_admin_update on categories for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy categories_admin_delete on categories for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- foam
alter table foam enable row level security;
create policy foam_public_read on foam for select using (true);
create policy foam_admin_insert on foam for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy foam_admin_update on foam for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy foam_admin_delete on foam for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- foam_grades
alter table foam_grades enable row level security;
create policy foam_grades_public_read on foam_grades for select using (true);
create policy foam_grades_admin_insert on foam_grades for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy foam_grades_admin_update on foam_grades for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy foam_grades_admin_delete on foam_grades for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- dimension_rules
alter table dimension_rules enable row level security;
create policy dimension_rules_public_read on dimension_rules for select using (true);
create policy dimension_rules_admin_insert on dimension_rules for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy dimension_rules_admin_update on dimension_rules for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy dimension_rules_admin_delete on dimension_rules for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fibre_wrap
alter table fibre_wrap enable row level security;
create policy fibre_wrap_public_read on fibre_wrap for select using (true);
create policy fibre_wrap_admin_insert on fibre_wrap for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fibre_wrap_admin_update on fibre_wrap for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fibre_wrap_admin_delete on fibre_wrap for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- bench_cushions
alter table bench_cushions enable row level security;
create policy bench_cushions_public_read on bench_cushions for select using (true);
create policy bench_cushions_admin_insert on bench_cushions for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushions_admin_update on bench_cushions for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushions_admin_delete on bench_cushions for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- bench_cushion_variables (no direct admin UI access outside the RPC, but
-- policies are still needed since the RPC runs SECURITY INVOKER)
alter table bench_cushion_variables enable row level security;
create policy bench_cushion_variables_public_read on bench_cushion_variables for select using (true);
create policy bench_cushion_variables_admin_insert on bench_cushion_variables for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushion_variables_admin_update on bench_cushion_variables for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushion_variables_admin_delete on bench_cushion_variables for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- bench_cushion_variable_options
alter table bench_cushion_variable_options enable row level security;
create policy bench_cushion_variable_options_public_read on bench_cushion_variable_options for select using (true);
create policy bench_cushion_variable_options_admin_insert on bench_cushion_variable_options for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushion_variable_options_admin_update on bench_cushion_variable_options for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy bench_cushion_variable_options_admin_delete on bench_cushion_variable_options for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fabric_price_tags
alter table fabric_price_tags enable row level security;
create policy fabric_price_tags_public_read on fabric_price_tags for select using (true);
create policy fabric_price_tags_admin_insert on fabric_price_tags for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tags_admin_update on fabric_price_tags for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tags_admin_delete on fabric_price_tags for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fabric_groups
alter table fabric_groups enable row level security;
create policy fabric_groups_public_read on fabric_groups for select using (true);
create policy fabric_groups_admin_insert on fabric_groups for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_groups_admin_update on fabric_groups for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_groups_admin_delete on fabric_groups for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fabric_price_ranges
alter table fabric_price_ranges enable row level security;
create policy fabric_price_ranges_public_read on fabric_price_ranges for select using (true);
create policy fabric_price_ranges_admin_insert on fabric_price_ranges for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_ranges_admin_update on fabric_price_ranges for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_ranges_admin_delete on fabric_price_ranges for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fabric_price_tiers
alter table fabric_price_tiers enable row level security;
create policy fabric_price_tiers_public_read on fabric_price_tiers for select using (true);
create policy fabric_price_tiers_admin_insert on fabric_price_tiers for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tiers_admin_update on fabric_price_tiers for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tiers_admin_delete on fabric_price_tiers for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- fabric_price_tier_materials
alter table fabric_price_tier_materials enable row level security;
create policy fabric_price_tier_materials_public_read on fabric_price_tier_materials for select using (true);
create policy fabric_price_tier_materials_admin_insert on fabric_price_tier_materials for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tier_materials_admin_update on fabric_price_tier_materials for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_price_tier_materials_admin_delete on fabric_price_tier_materials for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- products
alter table products enable row level security;
create policy products_public_read on products for select using (true);
create policy products_admin_insert on products for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy products_admin_update on products for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy products_admin_delete on products for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));
