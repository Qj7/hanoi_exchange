-- Minimal schema for connectivity checks and future app data.
-- Apply in Supabase: SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values ('schema_version', '1')
on conflict (key) do nothing;

alter table public.app_config enable row level security;

-- Public read for Mini App (adjust when you store sensitive config).
create policy "app_config_select_anon"
  on public.app_config
  for select
  to anon, authenticated
  using (true);
