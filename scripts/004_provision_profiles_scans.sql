-- new migration to provision missing public.profiles and public.scans with secure RLS

-- Ensure basic privileges; RLS still governs row-level access
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key,                           -- matches auth.users.id
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable and enforce RLS
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Idempotent policies: user can only access their own row
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert
  on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_self_delete on public.profiles;
create policy profiles_self_delete
  on public.profiles
  for delete
  using (id = auth.uid());

-- Auto-create profile for each new auth user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_auth_user();

-- SCANS TABLE
create table if not exists public.scans (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  barcode text,
  product_name text,
  nutrition jsonb
);

create index if not exists scans_user_id_idx on public.scans (user_id);
create index if not exists scans_created_at_idx on public.scans (created_at desc);

-- Enable and enforce RLS
alter table public.scans enable row level security;
alter table public.scans force row level security;

-- Owner-only policies based on user_id
drop policy if exists scans_self_select on public.scans;
create policy scans_self_select
  on public.scans
  for select
  using (user_id = auth.uid());

drop policy if exists scans_self_insert on public.scans;
create policy scans_self_insert
  on public.scans
  for insert
  with check (user_id = auth.uid());

drop policy if exists scans_self_update on public.scans;
create policy scans_self_update
  on public.scans
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scans_self_delete on public.scans;
create policy scans_self_delete
  on public.scans
  for delete
  using (user_id = auth.uid());

-- Ask PostgREST (Supabase REST) to reload schema cache to avoid PGRST205 after migration
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  -- ignore if not permitted
  null;
end $$;
