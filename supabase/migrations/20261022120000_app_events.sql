-- app_events: one row per thing worth knowing about right away -- a new paid order, a new sample
-- request, an email that failed, a payment webhook or checkout that errored. Each row is also sent
-- to the JL Comfort Telegram bot (lib/alerts/server.ts), and the admin Dashboard lists them, so
-- an error is never only in the Vercel logs. Written with the service-role key; admins can read.

create table if not exists app_events (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warning', 'error')),
  type text not null, -- order_paid, sample_request, email_failed, webhook_failed, checkout_failed, ...
  title text not null,
  detail text,
  link text, -- admin path to open, e.g. /admin/orders?order=<id>
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_events_created_at on app_events (created_at desc);
create index if not exists idx_app_events_level on app_events (level, created_at desc);

alter table app_events enable row level security;
create policy app_events_admin_read on app_events for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
