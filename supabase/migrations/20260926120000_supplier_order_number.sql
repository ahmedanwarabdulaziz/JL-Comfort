-- Links a JL order to the supplier's own order number (Charlotte's "Order #871459" / "Invoice #871459"),
-- so shipped emails and invoices from the supplier can be matched back to the right JL order.
alter table orders add column supplier_order_number text;
create index idx_orders_supplier_order_number on orders (supplier_order_number) where supplier_order_number is not null;
