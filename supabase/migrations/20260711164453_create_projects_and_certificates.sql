-- Projects table
create table projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  description     text not null,
  technologies    text[] not null default '{}',
  live_url        text,
  playstore_url   text,
  appstore_url    text,
  git_url         text,
  image_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_projects_user_id on projects (user_id);

-- updated_at trigger for projects
create trigger set_projects_updated_at
  before update on projects
  for each row
  execute function public.update_updated_at();

-- Certificates table
create table certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  url         text not null,
  start_date  date not null,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Date consistency: end_date must be null or >= start_date
alter table certificates
  add constraint certificates_end_date_check
  check (end_date is null or end_date >= start_date);

create index idx_certificates_user_id on certificates (user_id);

-- updated_at trigger for certificates
create trigger set_certificates_updated_at
  before update on certificates
  for each row
  execute function public.update_updated_at();
