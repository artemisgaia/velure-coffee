create extension if not exists pgcrypto;

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_intent_id text not null unique,
  order_draft_id text,
  payment_status text not null default 'unknown',
  currency text not null default 'USD',
  amount_total numeric(10, 2),
  subtotal numeric(10, 2),
  discount numeric(10, 2),
  shipping_total numeric(10, 2),
  tax numeric(10, 2),
  total numeric(10, 2),
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_country text,
  shipping_service text,
  shipping_zone text,
  package_weight_lbs numeric(8, 2),
  item_preview text,
  item_digest text,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_customer_orders_user_created_at
  on public.customer_orders (user_id, created_at desc);

create or replace function public.set_updated_at_customer_orders()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_orders_updated_at on public.customer_orders;
create trigger trg_customer_orders_updated_at
before update on public.customer_orders
for each row execute function public.set_updated_at_customer_orders();

alter table public.customer_orders enable row level security;

drop policy if exists "Users can read own orders" on public.customer_orders;
create policy "Users can read own orders"
on public.customer_orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.customer_orders;
create policy "Users can insert own orders"
on public.customer_orders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own orders" on public.customer_orders;
create policy "Users can update own orders"
on public.customer_orders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
