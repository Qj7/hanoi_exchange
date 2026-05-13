-- Allow operator workflow: pending → in_progress → completed

alter table public.exchange_orders
  drop constraint if exists exchange_orders_status_check;

alter table public.exchange_orders
  add constraint exchange_orders_status_check
  check (status in ('pending', 'in_progress', 'completed', 'cancelled'));
