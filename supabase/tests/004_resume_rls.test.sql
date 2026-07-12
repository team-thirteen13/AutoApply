-- ─────────────────────────────────────────────────────────────
-- RLS tests for resumes and resume_versions
-- 18 assertions total (9 per table)
-- ─────────────────────────────────────────────────────────────

BEGIN;

SELECT plan(18);

-- ── Setup ───────────────────────────────────────────────────

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-b@test.com');

-- ── Resumes tests ───────────────────────────────────────────

-- User A inserts own resume
SELECT lives_ok(
  $$INSERT INTO resumes (user_id, title) VALUES ('11111111-1111-1111-1111-111111111111', 'Resume A')$$,
  'resumes: User A can insert own row');

-- User B inserts own resume
SELECT lives_ok(
  $$INSERT INTO resumes (user_id, title) VALUES ('22222222-2222-2222-2222-222222222222', 'Resume B')$$,
  'resumes: User B can insert own row');

-- Simulate User A
SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SET role = 'authenticated';

-- User A can select own rows
SELECT is(
  (SELECT count(*)::int FROM resumes WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'resumes: User A can select own rows');

-- User A cannot select User B rows
SELECT is(
  (SELECT count(*)::int FROM resumes WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'resumes: User A cannot select User B rows');

-- User A can update own rows
SELECT lives_ok(
  $$UPDATE resumes SET title = 'Resume A Updated' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'resumes: User A can update own rows');

-- User A cannot update User B rows (0 rows affected)
SELECT results_eq(
  $$with updated as (
      update resumes set title = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'resumes: User A cannot update User B rows (0 rows affected)');

-- User A can delete own rows
SELECT lives_ok(
  $$DELETE FROM resumes WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'resumes: User A can delete own rows');

-- User A cannot delete User B rows (0 rows affected)
SELECT results_eq(
  $$with deleted as (
      delete from resumes
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'resumes: User A cannot delete User B rows (0 rows affected)');

-- ── Resume versions tests ───────────────────────────────────

-- Re-insert resumes for version tests
INSERT INTO resumes (id, user_id, title)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Resume A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Resume B');

-- User A inserts own version
SELECT lives_ok(
  $$INSERT INTO resume_versions (resume_id, user_id, snapshot, label)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '{"profile":{"name":"Test"}}'::jsonb, 'v1')$$,
  'resume_versions: User A can insert own row');

-- User B inserts own version
SELECT lives_ok(
  $$INSERT INTO resume_versions (resume_id, user_id, snapshot, label)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '{"profile":{"name":"Test"}}'::jsonb, 'v1')$$,
  'resume_versions: User B can insert own row');

-- User A can select own versions
SELECT is(
  (SELECT count(*)::int FROM resume_versions WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'resume_versions: User A can select own rows');

-- User A cannot select User B versions
SELECT is(
  (SELECT count(*)::int FROM resume_versions WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'resume_versions: User A cannot select User B rows');

-- User A cannot update versions (no UPDATE policy → default deny)
SELECT throws_ok(
  $$UPDATE resume_versions SET label = 'Hacked' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL,
  'resume_versions: authenticated user cannot update (no grant)');

-- User A can delete own versions
SELECT lives_ok(
  $$DELETE FROM resume_versions WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'resume_versions: User A can delete own rows');

-- User A cannot delete User B versions (0 rows affected)
SELECT results_eq(
  $$with deleted as (
      delete from resume_versions
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'resume_versions: User A cannot delete User B rows (0 rows affected)');

SELECT finish();
ROLLBACK;
