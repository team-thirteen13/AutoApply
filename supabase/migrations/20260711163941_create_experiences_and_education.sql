-- Experiences table
create table experiences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  company         text not null,
  title           text not null,
  company_url     text,
  start_date      date not null,
  end_date        date,
  is_current      boolean not null default false,
  accomplishments text[] not null default '{}',
  skills          text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Date consistency: end_date must be null or >= start_date
alter table experiences
  add constraint experiences_end_date_check
  check (end_date is null or end_date >= start_date);

-- Current status: if is_current then end_date must be null
alter table experiences
  add constraint experiences_is_current_check
  check (not is_current or end_date is null);

create index idx_experiences_user_id on experiences (user_id);

-- updated_at trigger for experiences
create trigger set_experiences_updated_at
  before update on experiences
  for each row
  execute function public.update_updated_at();

-- Education table
create table education (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  university  text not null,
  degree      text not null,
  start_date  date not null,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Date consistency: end_date must be null or >= start_date
alter table education
  add constraint education_end_date_check
  check (end_date is null or end_date >= start_date);

create index idx_education_user_id on education (user_id);

-- updated_at trigger for education
create trigger set_education_updated_at
  before update on education
  for each row
  execute function public.update_updated_at();
