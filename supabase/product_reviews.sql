create extension if not exists pgcrypto;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null,
  rating smallint not null check (rating between 1 and 5),
  headline text not null default '',
  comment text not null,
  display_name text not null default 'Verified Customer',
  verified_purchase boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_reviews_status_check check (status in ('published', 'pending', 'rejected')),
  constraint product_reviews_product_check check (product_id in ('fuse', 'zen', 'onyx', 'vitality', 'harvest', 'aureo')),
  constraint product_reviews_unique_user_product unique (user_id, product_id)
);

create index if not exists idx_product_reviews_product_created_at
  on public.product_reviews (product_id, created_at desc);

create index if not exists idx_product_reviews_user_created_at
  on public.product_reviews (user_id, created_at desc);

create or replace function public.set_updated_at_product_reviews()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_product_reviews_updated_at on public.product_reviews;
create trigger trg_product_reviews_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at_product_reviews();

alter table public.product_reviews enable row level security;

drop policy if exists "Public can read published reviews" on public.product_reviews;
create policy "Public can read published reviews"
on public.product_reviews
for select
to anon, authenticated
using (status = 'published' or auth.uid() = user_id);

drop policy if exists "Users can insert own reviews" on public.product_reviews;
create policy "Users can insert own reviews"
on public.product_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own reviews" on public.product_reviews;
create policy "Users can update own reviews"
on public.product_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.product_reviews;
create policy "Users can delete own reviews"
on public.product_reviews
for delete
to authenticated
using (auth.uid() = user_id);
