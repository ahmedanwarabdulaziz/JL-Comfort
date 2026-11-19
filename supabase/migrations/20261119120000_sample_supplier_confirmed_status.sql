-- New sample request status: supplier_confirmed ("Confirmed by supplier").
-- Set when Charlotte's "Sample Request Confirmation" email arrives and the admin clicks
-- "Charlotte confirmed — email customer". Flow:
--   pending -> sent_to_supplier -> supplier_confirmed -> shipped -> delivered (plus cancelled, problem)

alter table sample_requests drop constraint if exists sample_requests_status_check;
alter table sample_requests add constraint sample_requests_status_check
  check (status in ('pending', 'sent_to_supplier', 'supplier_confirmed', 'shipped', 'delivered', 'cancelled', 'problem'));

-- Backfill: requests already marked as confirmed by Charlotte but not shipped yet.
update sample_requests r
set status = 'supplier_confirmed'
where r.status in ('pending', 'sent_to_supplier')
  and exists (
    select 1 from sample_request_events e
    where e.sample_request_id = r.id and e.type = 'supplier_confirmed'
  );
