-- Phase 2: Firebase -> Supabase migration
-- RLS for charlotte_fabrics, fabric_group_members, charlotte_fabric_sync_runs,
-- sample_requests, sample_request_items. Follows the Phase 1 admin_users
-- pattern.

-- ---------------------------------------------------------------------------
-- charlotte_fabrics: public read (matches Firestore's allow read: if true),
-- admin-gated writes. Bulk writes from the sync scripts go through the
-- service_role key, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
alter table charlotte_fabrics enable row level security;
create policy charlotte_fabrics_public_read on charlotte_fabrics for select using (true);
create policy charlotte_fabrics_admin_insert on charlotte_fabrics for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy charlotte_fabrics_admin_update on charlotte_fabrics for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy charlotte_fabrics_admin_delete on charlotte_fabrics for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- fabric_group_members: public read, admin-gated writes
-- ---------------------------------------------------------------------------
alter table fabric_group_members enable row level security;
create policy fabric_group_members_public_read on fabric_group_members for select using (true);
create policy fabric_group_members_admin_insert on fabric_group_members for insert
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
create policy fabric_group_members_admin_delete on fabric_group_members for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- charlotte_fabric_sync_runs: admin-only read (this is operational data --
-- Firestore let any authenticated user read it, this tightens that same gap).
-- No insert/update policy for anon/authenticated at all -- only service_role
-- (the sync scripts) writes these, matching Firestore's allow write: if false.
-- Realtime respects RLS per-subscriber, so this also gates who receives the
-- live sync-progress events.
-- ---------------------------------------------------------------------------
alter table charlotte_fabric_sync_runs enable row level security;
create policy sync_runs_admin_read on charlotte_fabric_sync_runs for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- sample_requests / sample_request_items: admin-only read/update, no public
-- write at all (Firestore had create,delete: if false; read,update:
-- isAuthenticated() -- tightened here to admin_users, same as everywhere
-- else). Creation only via the public API route using the service-role
-- client, bypassing RLS by design.
-- ---------------------------------------------------------------------------
alter table sample_requests enable row level security;
create policy sample_requests_admin_read on sample_requests for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy sample_requests_admin_update on sample_requests for update
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));

alter table sample_request_items enable row level security;
create policy sample_request_items_admin_read on sample_request_items for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
