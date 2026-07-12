-- ─────────────────────────────────────────────────────────────
-- RLS policies for resumes and resume_versions
-- ─────────────────────────────────────────────────────────────

-- ── Resumes ────────────────────────────────────────────────

alter table resumes enable row level security;

create policy "resumes_select_own"
  on resumes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "resumes_insert_own"
  on resumes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "resumes_update_own"
  on resumes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "resumes_delete_own"
  on resumes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── Resume versions ────────────────────────────────────────

alter table resume_versions enable row level security;

create policy "resume_versions_select_own"
  on resume_versions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "resume_versions_insert_own"
  on resume_versions for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- No UPDATE policy → default deny (versions are immutable snapshots)

create policy "resume_versions_delete_own"
  on resume_versions for delete to authenticated
  using ((select auth.uid()) = user_id);
