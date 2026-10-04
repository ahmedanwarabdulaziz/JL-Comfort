-- A backup inbox that gets a hidden (BCC) copy of every purchase order and sample request emailed
-- to the supplier, to confirm exactly what the supplier received. Blank = no copy.
alter table email_settings add column if not exists supplier_copy_email text;
