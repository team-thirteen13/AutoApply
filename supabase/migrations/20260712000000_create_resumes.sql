-- ─────────────────────────────────────────────────────────────
-- Create resumes and resume_versions tables
-- ─────────────────────────────────────────────────────────────

create table resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  target_role text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_resumes_user_id on resumes (user_id);

create trigger set_resumes_updated_at
  before update on resumes
  for each row
  execute function public.update_updated_at();

create table resume_versions (
  id         uuid primary key default gen_random_uuid(),
  resume_id  uuid not null references resumes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  snapshot   jsonb not null default '{}'::jsonb,
  label      text,
  created_at timestamptz not null default now()
);

create index idx_resume_versions_resume_id on resume_versions (resume_id);
create index idx_resume_versions_user_id on resume_versions (user_id);
