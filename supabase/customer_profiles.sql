create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  marketing_preferences jsonb not null default '{"email": true, "sms": false}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_profiles
  add column if not exists email text not null default '';

create or replace function public.set_updated_at_customer_profiles()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at_customer_profiles();

alter table public.customer_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.customer_profiles;
create policy "Users can read own profile"
on public.customer_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.customer_profiles;
create policy "Users can insert own profile"
on public.customer_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.customer_profiles;
create policy "Users can update own profile"
on public.customer_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
