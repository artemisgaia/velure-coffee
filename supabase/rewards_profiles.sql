-- Run this in Supabase SQL Editor once per project.

create table if not exists public.rewards_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rewards_profiles_updated_at on public.rewards_profiles;
create trigger trg_rewards_profiles_updated_at
before update on public.rewards_profiles
for each row
execute function public.set_updated_at_timestamp();

alter table public.rewards_profiles enable row level security;

drop policy if exists "Users can read own rewards profile" on public.rewards_profiles;
create policy "Users can read own rewards profile"
on public.rewards_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own rewards profile" on public.rewards_profiles;
create policy "Users can insert own rewards profile"
on public.rewards_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own rewards profile" on public.rewards_profiles;
create policy "Users can update own rewards profile"
on public.rewards_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
