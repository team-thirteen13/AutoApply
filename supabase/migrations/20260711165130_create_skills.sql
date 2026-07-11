-- Skills table (global canonical lookup)
create table skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness on skill name
create unique index idx_skills_name_lower on skills (lower(name));

-- User skills junction table (user's overall skill inventory)
create table user_skills (
  user_id    uuid not null references auth.users(id) on delete cascade,
  skill_id   uuid not null references skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create index idx_user_skills_skill_id on user_skills (skill_id);
