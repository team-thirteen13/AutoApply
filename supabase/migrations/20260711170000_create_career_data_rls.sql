-- =============================================================================
-- Phase 4.2: Career Data RLS
-- Enable RLS and owner-only policies on experiences, education, projects,
-- certificates. All policies: TO authenticated, ownership via auth.uid().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- experiences
-- -----------------------------------------------------------------------------
alter table experiences enable row level security;

create policy "experiences_select_own"
  on experiences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "experiences_insert_own"
  on experiences for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "experiences_update_own"
  on experiences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "experiences_delete_own"
  on experiences for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- education
-- -----------------------------------------------------------------------------
alter table education enable row level security;

create policy "education_select_own"
  on education for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "education_insert_own"
  on education for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "education_update_own"
  on education for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "education_delete_own"
  on education for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
alter table projects enable row level security;

create policy "projects_select_own"
  on projects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "projects_insert_own"
  on projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "projects_update_own"
  on projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "projects_delete_own"
  on projects for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- certificates
-- -----------------------------------------------------------------------------
alter table certificates enable row level security;

create policy "certificates_select_own"
  on certificates for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "certificates_insert_own"
  on certificates for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "certificates_update_own"
  on certificates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "certificates_delete_own"
  on certificates for delete to authenticated
  using ((select auth.uid()) = user_id);
