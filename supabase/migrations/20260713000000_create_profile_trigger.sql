-- ─────────────────────────────────────────────────────────────
-- Auto-create profile for new auth users
-- ─────────────────────────────────────────────────────────────
-- Creates a minimal profiles row whenever a new auth.users
-- record is inserted. Covers both email/password and OAuth.
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, user_id, name, email, phone, location)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Trigger: after insert on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
