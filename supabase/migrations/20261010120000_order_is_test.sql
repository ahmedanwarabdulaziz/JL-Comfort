-- Orders paid through the Stripe test account by an admin (admin panel → "Test payments" switch).
-- They show a TEST badge in the admin panel, never email the supplier a purchase order, don't use up
-- discount codes and aren't reported to the ad platforms. Every existing order is a real one.
alter table orders add column if not exists is_test boolean not null default false;
