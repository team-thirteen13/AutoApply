-- =============================================================================
-- Phase 4.3: Skills RLS
-- Enable RLS on skills (global lookup) and user_skills (owner junction).
-- skills:      authenticated read/insert, no update/delete (default deny).
-- user_skills: owner-only select/insert/delete, no update (default deny).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- skills (global canonical lookup — no user_id column)
-- -----------------------------------------------------------------------------
alter table skills enable row level security;

-- SELECT: any authenticated user can read the global skill list
create policy "skills_select_authenticated"
  on skills for select to authenticated
  using (true);

-- INSERT: any authenticated user can add a new skill
create policy "skills_insert_authenticated"
  on skills for insert to authenticated
  with check (true);

-- No UPDATE policy → default deny
-- No DELETE policy → default deny

-- -----------------------------------------------------------------------------
-- user_skills (junction table — user_id + skill_id composite PK)
-- -----------------------------------------------------------------------------
alter table user_skills enable row level security;

-- SELECT: users can read their own skill associations
create policy "user_skills_select_own"
  on user_skills for select to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: users can add skills to their own inventory
create policy "user_skills_insert_own"
  on user_skills for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- DELETE: users can remove skills from their own inventory
create policy "user_skills_delete_own"
  on user_skills for delete to authenticated
  using ((select auth.uid()) = user_id);

-- No UPDATE policy → default deny (use delete + insert to change associations)
