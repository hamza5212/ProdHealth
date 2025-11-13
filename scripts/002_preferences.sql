alter table if exists public.profiles
add column if not exists preferences jsonb default '{}'::jsonb;
