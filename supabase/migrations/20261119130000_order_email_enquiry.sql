-- "This customer emailed us before ordering", ticked by an admin on Admin → Orders (the site can't see
-- the inbox). Shown with the other customer-source tags: samples first (matched automatically) and
-- the visit channel (from orders.attribution).
alter table orders add column if not exists email_enquiry boolean not null default false;
