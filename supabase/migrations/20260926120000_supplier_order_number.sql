-- Links a JL order to the supplier's own numbers, so emails and invoices from the supplier can be
-- matched back to the right JL order. Charlotte uses two different numbers for one order:
--   supplier_order_number   -- "Order Reference# 4333624" on the order receipt (info@charlottefabrics.com)
--   supplier_invoice_number -- "Invoice #871459" on the shipped email (orders@charlottefabrics.com)
alter table orders add column supplier_order_number text;
alter table orders add column supplier_invoice_number text;
create index idx_orders_supplier_order_number on orders (supplier_order_number) where supplier_order_number is not null;
create index idx_orders_supplier_invoice_number on orders (supplier_invoice_number) where supplier_invoice_number is not null;
