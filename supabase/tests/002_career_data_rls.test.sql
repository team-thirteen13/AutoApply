-- =============================================================================
-- 002: Career Data RLS Tests
-- Verify User A cannot read, insert, update, or delete User B's career data.
-- Covers: experiences, education, projects, certificates.
-- =============================================================================

BEGIN;

SELECT plan(36);

-- ─── Setup ──────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-b@test.com');

INSERT INTO experiences (user_id, company, title, start_date)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Company A', 'Engineer A', '2024-01-01'),
  ('22222222-2222-2222-2222-222222222222', 'Company B', 'Engineer B', '2024-01-01');

INSERT INTO education (user_id, university, degree, start_date)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Uni A', 'BS', '2020-01-01'),
  ('22222222-2222-2222-2222-222222222222', 'Uni B', 'MS', '2020-01-01');

INSERT INTO projects (user_id, title, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Project A', 'Desc A'),
  ('22222222-2222-2222-2222-222222222222', 'Project B', 'Desc B');

INSERT INTO certificates (user_id, name, url, start_date)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Cert A', 'https://cert-a.com', '2024-01-01'),
  ('22222222-2222-2222-2222-222222222222', 'Cert B', 'https://cert-b.com', '2024-01-01');

-- ─── Simulate User A ───────────────────────────────────────────────────────

SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SET role = 'authenticated';

-- ═══════════════════════════════════════════════════════════════════════════
-- experiences (9 tests)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT is(
  (SELECT count(*)::int FROM experiences WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'exp: User A can select own rows');

SELECT is(
  (SELECT count(*)::int FROM experiences WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'exp: User A cannot select User B rows');

SELECT lives_ok(
  $$INSERT INTO experiences (user_id, company, title, start_date)
    VALUES ('11111111-1111-1111-1111-111111111111', 'New Co', 'New Role', '2024-06-01')$$,
  'exp: User A can insert own row');

SELECT throws_ok(
  $$INSERT INTO experiences (user_id, company, title, start_date)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake Co', 'Fake', '2024-06-01')$$,
  42501, NULL, 'exp: User A cannot insert with User B user_id');

SELECT lives_ok(
  $$UPDATE experiences SET title = 'Updated A' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'exp: User A can update own row');

SELECT results_eq(
  $$with updated as (
      update experiences set title = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'exp: User A cannot update User B rows (0 rows affected)');

SELECT throws_ok(
  $$UPDATE experiences SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL, 'exp: User A cannot reassign row to User B');

SELECT lives_ok(
  $$DELETE FROM experiences WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'exp: User A can delete own row');

SELECT results_eq(
  $$with deleted as (
      delete from experiences
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'exp: User A cannot delete User B rows (0 rows affected)');

-- ═══════════════════════════════════════════════════════════════════════════
-- education (9 tests)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT is(
  (SELECT count(*)::int FROM education WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'edu: User A can select own rows');

SELECT is(
  (SELECT count(*)::int FROM education WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'edu: User A cannot select User B rows');

SELECT lives_ok(
  $$INSERT INTO education (user_id, university, degree, start_date)
    VALUES ('11111111-1111-1111-1111-111111111111', 'New Uni', 'PhD', '2024-06-01')$$,
  'edu: User A can insert own row');

SELECT throws_ok(
  $$INSERT INTO education (user_id, university, degree, start_date)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake Uni', 'Fake', '2024-06-01')$$,
  42501, NULL, 'edu: User A cannot insert with User B user_id');

SELECT lives_ok(
  $$UPDATE education SET degree = 'Updated BS' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'edu: User A can update own row');

SELECT results_eq(
  $$with updated as (
      update education set degree = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'edu: User A cannot update User B rows (0 rows affected)');

SELECT throws_ok(
  $$UPDATE education SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL, 'edu: User A cannot reassign row to User B');

SELECT lives_ok(
  $$DELETE FROM education WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'edu: User A can delete own row');

SELECT results_eq(
  $$with deleted as (
      delete from education
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'edu: User A cannot delete User B rows (0 rows affected)');

-- ═══════════════════════════════════════════════════════════════════════════
-- projects (9 tests)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT is(
  (SELECT count(*)::int FROM projects WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'proj: User A can select own rows');

SELECT is(
  (SELECT count(*)::int FROM projects WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'proj: User A cannot select User B rows');

SELECT lives_ok(
  $$INSERT INTO projects (user_id, title, description)
    VALUES ('11111111-1111-1111-1111-111111111111', 'New Proj', 'New Desc')$$,
  'proj: User A can insert own row');

SELECT throws_ok(
  $$INSERT INTO projects (user_id, title, description)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake Proj', 'Fake')$$,
  42501, NULL, 'proj: User A cannot insert with User B user_id');

SELECT lives_ok(
  $$UPDATE projects SET title = 'Updated Proj' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'proj: User A can update own row');

SELECT results_eq(
  $$with updated as (
      update projects set title = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'proj: User A cannot update User B rows (0 rows affected)');

SELECT throws_ok(
  $$UPDATE projects SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL, 'proj: User A cannot reassign row to User B');

SELECT lives_ok(
  $$DELETE FROM projects WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'proj: User A can delete own row');

SELECT results_eq(
  $$with deleted as (
      delete from projects
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'proj: User A cannot delete User B rows (0 rows affected)');

-- ═══════════════════════════════════════════════════════════════════════════
-- certificates (9 tests)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT is(
  (SELECT count(*)::int FROM certificates WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'cert: User A can select own rows');

SELECT is(
  (SELECT count(*)::int FROM certificates WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'cert: User A cannot select User B rows');

SELECT lives_ok(
  $$INSERT INTO certificates (user_id, name, url, start_date)
    VALUES ('11111111-1111-1111-1111-111111111111', 'New Cert', 'https://new.com', '2024-06-01')$$,
  'cert: User A can insert own row');

SELECT throws_ok(
  $$INSERT INTO certificates (user_id, name, url, start_date)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake Cert', 'https://fake.com', '2024-06-01')$$,
  42501, NULL, 'cert: User A cannot insert with User B user_id');

SELECT lives_ok(
  $$UPDATE certificates SET name = 'Updated Cert' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'cert: User A can update own row');

SELECT results_eq(
  $$with updated as (
      update certificates set name = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'cert: User A cannot update User B rows (0 rows affected)');

SELECT throws_ok(
  $$UPDATE certificates SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL, 'cert: User A cannot reassign row to User B');

SELECT lives_ok(
  $$DELETE FROM certificates WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'cert: User A can delete own row');

SELECT results_eq(
  $$with deleted as (
      delete from certificates
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'cert: User A cannot delete User B rows (0 rows affected)');

-- ─── Finish ─────────────────────────────────────────────────────────────────

SELECT finish();
ROLLBACK;
