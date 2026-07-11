-- Update trigger function for updated_at columns
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles table
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text not null,
  location    text not null,
  github_url    text,
  linkedin_url  text,
  portfolio_url text,
  tagline     text,
  bio         text,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index (user_id UNIQUE already indexed, no additional index needed)

-- updated_at trigger for profiles
create trigger set_profiles_updated_at
  before update on profiles
  for each row
  execute function public.update_updated_at();
