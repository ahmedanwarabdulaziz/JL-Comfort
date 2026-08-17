-- AI shopping guide conversation log, for admin visibility into what customers ask
-- (fabric_ai_plan.md section "Track" / canada_fabric_business_strategy.md section 32).
-- Never read back into the AI -- this is an audit/analytics log only, not conversation
-- memory. Follows the same public-insert-via-service-role, admin-only-read pattern as
-- sample_requests (see 20260817120100_phase2_rls.sql).

create table ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null, -- anonymous client-generated id (crypto.randomUUID(), sessionStorage) -- not tied to a login
  mode text not null check (mode in ('guided', 'chat')),
  user_message text, -- null for the guided chip flow, which has no free-text input
  assistant_message text not null,
  filters jsonb not null default '{}'::jsonb,
  product_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_ai_chat_logs_session on ai_chat_logs (session_id);
create index idx_ai_chat_logs_created_at on ai_chat_logs (created_at desc);

alter table ai_chat_logs enable row level security;
create policy ai_chat_logs_admin_read on ai_chat_logs for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy ai_chat_logs_admin_delete on ai_chat_logs for delete
  using (exists (select 1 from admin_users where user_id = auth.uid()));
-- No public policies at all -- inserts happen only via app/api/ai/route.ts's service-role
-- client, bypassing RLS by design (same as sample_requests).
