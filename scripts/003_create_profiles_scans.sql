-- Ensure UUID generation is available
create extension if not exists "pgcrypto";

-- ========== Profiles ==========
create table if not exists public.profiles (
  id uuid primary key,                    -- maps to auth.users.id
  email text,                             -- optional cached email
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Shared updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep updated_at fresh
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Owner-only policies for profiles
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== Scans ==========
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barcode text,
  product_name text,
  nutrition jsonb,
  image_url text,
  score integer check (score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scans enable row level security;

-- Keep updated_at fresh on scans
drop trigger if exists set_scans_updated_at on public.scans;
create trigger set_scans_updated_at
before update on public.scans
for each row execute function public.set_updated_at();

-- Owner-only policies for scans
drop policy if exists "Scans are viewable by owner" on public.scans;
create policy "Scans are viewable by owner"
on public.scans
for select
using (auth.uid() = user_id);

drop policy if exists "Scans are insertable by owner" on public.scans;
create policy "Scans are insertable by owner"
on public.scans
for insert
with check (auth.uid() = user_id);

drop policy if exists "Scans are updatable by owner" on public.scans;
create policy "Scans are updatable by owner"
on public.scans
for update
using (auth.uid() = user_id);

drop policy if exists "Scans are deletable by owner" on public.scans;
create policy "Scans are deletable by owner"
on public.scans
for delete
using (auth.uid() = user_id);
