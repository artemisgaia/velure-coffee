create extension if not exists pgcrypto;

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default '',
  recipient_name text not null default '',
  phone text not null default '',
  address_line1 text not null,
  address_line2 text not null default '',
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_customer_addresses_user_created_at
  on public.customer_addresses (user_id, created_at desc);

create unique index if not exists idx_customer_addresses_single_default
  on public.customer_addresses (user_id)
  where is_default = true;

create or replace function public.set_updated_at_customer_addresses()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_addresses_updated_at on public.customer_addresses;
create trigger trg_customer_addresses_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at_customer_addresses();

alter table public.customer_addresses enable row level security;

drop policy if exists "Users can read own addresses" on public.customer_addresses;
create policy "Users can read own addresses"
on public.customer_addresses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses" on public.customer_addresses;
create policy "Users can insert own addresses"
on public.customer_addresses
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses" on public.customer_addresses;
create policy "Users can update own addresses"
on public.customer_addresses
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses" on public.customer_addresses;
create policy "Users can delete own addresses"
on public.customer_addresses
for delete
to authenticated
using (auth.uid() = user_id);
