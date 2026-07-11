-- Enable RLS on profiles
alter table profiles enable row level security;

-- SELECT: authenticated users can read their own profile
create policy "profiles_select_own"
  on profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
  );

-- INSERT: authenticated users can create their own profile
create policy "profiles_insert_own"
  on profiles
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
  );

-- UPDATE: authenticated users can update their own profile
create policy "profiles_update_own"
  on profiles
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
  )
  with check (
    (select auth.uid()) = user_id
  );

-- DELETE: authenticated users can delete their own profile
create policy "profiles_delete_own"
  on profiles
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
  );
