-- Job Search Copilot — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

-- Pipeline columns
create type job_status as enum ('wishlist', 'applied', 'interviewing', 'offer', 'rejected');

-- One profile per user; stores the base resume reused for every kit generation.
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  resume_text text not null default '',
  updated_at timestamptz not null default now()
);

-- Job cards.
create table public.jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default '',
  company     text not null default '',
  url         text,
  description text not null default '',
  status      job_status not null default 'wishlist',
  sort_order  double precision not null default 0,
  kit         jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index jobs_user_status_idx on public.jobs (user_id, status, sort_order);

-- Keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: every row is scoped to its owner.
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

create policy "own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own jobs"
  on public.jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
