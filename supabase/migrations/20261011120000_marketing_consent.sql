-- Marketing email consent, collected by the optional checkbox at checkout (CASL: express consent,
-- never pre-ticked). email_subscribers is the record of who agreed, to what wording, when and from
-- where; orders.marketing_opt_in notes whether the box was ticked on that particular checkout.
alter table orders add column if not exists marketing_opt_in boolean not null default false;

create table if not exists email_subscribers (
  email text primary key, -- lower-cased
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  consent_text text not null,
  source text not null, -- e.g. 'checkout'
  consented_at timestamptz not null default now(),
  consent_ip text,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  updated_at timestamptz not null default now()
);

alter table email_subscribers enable row level security;
create policy email_subscribers_admin_read on email_subscribers for select
  using (exists (select 1 from admin_users where user_id = auth.uid()));
