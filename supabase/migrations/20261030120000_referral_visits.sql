-- Referral tracking: how many visitors each tagged link brings (e.g. the JL Comfort promos on
-- jlupholstery.com: utm_source=jlupholstery, utm_campaign=<placement>, utm_content=<page>), and
-- what they go on to do. Read by Admin -> Referrals.
--
-- referral_visits: one row per arrival on the site from a link with utm_source. Holds only the
-- link's tags, the landing page and whether it was this browser's first arrival from that source
-- (so the report can count unique visitors without storing any identifier). No IP, no cookies, no
-- personal data, so it's counted whatever the visitor chooses in the cookie banner.
-- Written by /api/referral-visit with the service-role key; admins can read.

create table if not exists referral_visits (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  medium text,
  campaign text,
  content text,
  term text,
  landing_page text,
  first_visit boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_referral_visits_created_at on referral_visits (created_at desc);
create index if not exists idx_referral_visits_source on referral_visits (source, created_at desc);

alter table referral_visits enable row level security;
create policy referral_visits_admin_read on referral_visits for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));

-- sample_requests.attribution: where the requester came from, the same shape as orders.attribution
-- (first and last marketing touch, from lib/analytics/attribution.ts).
alter table sample_requests add column if not exists attribution jsonb;
