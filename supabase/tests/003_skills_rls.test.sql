-- =============================================================================
-- 003: Skills RLS Tests
-- Verify skills (global) and user_skills (junction) access controls.
-- Skills/user_skills lack UPDATE/DELETE grants, so denied operations fail
-- at the privilege level (error 42501), tested via throws_ok.
-- =============================================================================

BEGIN;

SELECT plan(14);

-- ─── Setup ──────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-b@test.com');

INSERT INTO skills (name) VALUES ('TypeScript');

INSERT INTO user_skills (user_id, skill_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM skills WHERE name = 'TypeScript';

INSERT INTO user_skills (user_id, skill_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM skills WHERE name = 'TypeScript';

-- ═══════════════════════════════════════════════════════════════════════════
-- skills (global table — no user_id)
-- ═══════════════════════════════════════════════════════════════════════════

SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SET role = 'authenticated';

-- SELECT: authenticated can read all skills
SELECT is(
  (SELECT count(*)::int FROM skills WHERE name = 'TypeScript'),
  1, 'skills: authenticated user can select all skills');

-- INSERT: authenticated can add a skill
SELECT lives_ok(
  $$INSERT INTO skills (name) VALUES ('Rust')$$,
  'skills: authenticated user can insert a skill');

-- UPDATE: denied (no grant) — fails at privilege level
SELECT throws_ok(
  $$UPDATE skills SET name = 'Hacked' WHERE name = 'Rust'$$,
  42501, NULL,
  'skills: authenticated user cannot update skills (no grant)');

-- DELETE: denied (no grant) — fails at privilege level
SELECT throws_ok(
  $$DELETE FROM skills WHERE name = 'Rust'$$,
  42501, NULL,
  'skills: authenticated user cannot delete skills (no grant)');

-- Anon: SELECT denied (no grant) — fails at privilege level
RESET request.jwt.claims;
SET role = 'anon';

SELECT throws_ok(
  $$SELECT count(*) FROM skills$$,
  42501, NULL,
  'skills: anon user cannot select skills (no grant)');

-- Anon: INSERT denied (RLS policy)
SELECT throws_ok(
  $$INSERT INTO skills (name) VALUES ('Python')$$,
  42501, NULL,
  'skills: anon user cannot insert skills');

-- ═══════════════════════════════════════════════════════════════════════════
-- user_skills (junction table — user_id + skill_id)
-- ═══════════════════════════════════════════════════════════════════════════

SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SET role = 'authenticated';

-- SELECT own: allowed
SELECT is(
  (SELECT count(*)::int FROM user_skills WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'user_skills: User A can select own associations');

-- SELECT other: denied (RLS)
SELECT is(
  (SELECT count(*)::int FROM user_skills WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'user_skills: User A cannot select User B associations');

-- INSERT own: allowed (delete first to avoid duplicate key)
SELECT lives_ok(
  $$DELETE FROM user_skills WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'user_skills: User A can delete own (setup for re-insert)');

SELECT lives_ok(
  $$INSERT INTO user_skills (user_id, skill_id)
    SELECT '11111111-1111-1111-1111-111111111111', id FROM skills WHERE name = 'TypeScript'$$,
  'user_skills: User A can insert own association');

-- INSERT other: denied (RLS WITH CHECK)
SELECT throws_ok(
  $$INSERT INTO user_skills (user_id, skill_id)
    SELECT '22222222-2222-2222-2222-222222222222', id FROM skills WHERE name = 'TypeScript'$$,
  42501, NULL,
  'user_skills: User A cannot insert User B association');

-- DELETE own: allowed
SELECT lives_ok(
  $$DELETE FROM user_skills WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'user_skills: User A can delete own association');

-- DELETE other: denied (RLS — can't see User B's rows)
SELECT results_eq(
  $$with deleted as (
      delete from user_skills
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'user_skills: User A cannot delete User B associations (0 rows affected)');

-- UPDATE: denied (no grant) — fails at privilege level
SELECT throws_ok(
  $$UPDATE user_skills SET skill_id = '00000000-0000-0000-0000-000000000000'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL,
  'user_skills: UPDATE denied (no grant)');

-- ─── Finish ─────────────────────────────────────────────────────────────────

SELECT finish();
ROLLBACK;
