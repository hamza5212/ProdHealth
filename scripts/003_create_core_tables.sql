-- Enable useful extension (safe if already enabled)
create extension if not exists pgcrypto;

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'select_own_profile'
  ) then
    create policy select_own_profile
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'upsert_own_profile'
  ) then
    create policy upsert_own_profile
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'update_own_profile'
  ) then
    create policy update_own_profile
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end$$;

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach trigger (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end$$;

-- SCANS TABLE
create table if not exists public.scans (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  barcode text,
  product_name text,
  brand text,
  image_url text,
  score int,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_user_created_at on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scans' and policyname = 'select_own_scans'
  ) then
    create policy select_own_scans
      on public.scans
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scans' and policyname = 'insert_own_scans'
  ) then
    create policy insert_own_scans
      on public.scans
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scans' and policyname = 'update_own_scans'
  ) then
    create policy update_own_scans
      on public.scans
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scans' and policyname = 'delete_own_scans'
  ) then
    create policy delete_own_scans
      on public.scans
      for delete
      using (auth.uid() = user_id);
  end if;
end$$;
