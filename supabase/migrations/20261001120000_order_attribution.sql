-- Where each order came from, for the admin panel's "Source" and for marketing reports:
--   attribution: first and last marketing touch (utm_* parameters, ad click ids, referrer, landing
--                page) as captured by lib/analytics/attribution.ts.
--   ad_signals:  what the server needs to report the purchase to GA4 / Meta itself (consent flags,
--                GA client id, Meta browser ids, and -- only with advertising consent -- the
--                shopper's IP and user agent). See lib/analytics/serverConversions.ts.
-- Both are nullable: older orders, and orders from browsers with storage blocked, have neither.
alter table orders add column attribution jsonb;
alter table orders add column ad_signals jsonb;
alter table orders add column conversions_reported_at timestamptz;
