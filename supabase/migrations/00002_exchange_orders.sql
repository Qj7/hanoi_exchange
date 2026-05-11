-- Exchange orders from the Telegram Mini App (inserted via server API + service role).

create table if not exists public.exchange_orders (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  telegram_username text,
  telegram_first_name text,
  give_currency text not null,
  receive_currency text not null,
  amount_side text not null check (amount_side in ('give', 'receive')),
  amount_input numeric not null,
  give_amount numeric not null,
  receive_amount numeric not null,
  rate numeric,
  pay_methods text[] not null default '{}',
  receive_method text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists exchange_orders_user_created_idx
  on public.exchange_orders (telegram_user_id, created_at desc);

alter table public.exchange_orders enable row level security;
-- No policies: only the service role (server) accesses this table.
