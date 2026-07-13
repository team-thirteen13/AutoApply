-- =============================================================================
-- 001: Profiles RLS Tests
-- Verify that User A cannot read, insert, update, or delete User B's profiles.
-- =============================================================================

BEGIN;

SELECT plan(9);

-- ─── Setup ──────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, aud, role, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-b@test.com');

-- The on_auth_user_created trigger auto-creates profiles for new users.
-- Delete them so we can insert test-specific data.
DELETE FROM profiles WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

INSERT INTO profiles (user_id, name, email, phone, location)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'User A', 'a@test.com', '111', 'City A'),
  ('22222222-2222-2222-2222-222222222222', 'User B', 'b@test.com', '222', 'City B');

-- ─── Simulate User A ───────────────────────────────────────────────────────

SET request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SET role = 'authenticated';

-- ─── SELECT ─────────────────────────────────────────────────────────────────

SELECT is(
  (SELECT count(*)::int FROM profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  1, 'User A can select own profile');

SELECT is(
  (SELECT count(*)::int FROM profiles WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'User A cannot select User B profile');

-- ─── INSERT ─────────────────────────────────────────────────────────────────
-- Delete existing profile first (UNIQUE on user_id), then re-insert

SELECT lives_ok(
  $$DELETE FROM profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'User A can delete own profile (setup for re-insert)');

SELECT lives_ok(
  $$INSERT INTO profiles (user_id, name, email, phone, location)
    VALUES ('11111111-1111-1111-1111-111111111111', 'User A New', 'a2@test.com', '333', 'City A2')$$,
  'User A can insert own profile');

SELECT throws_ok(
  $$INSERT INTO profiles (user_id, name, email, phone, location)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake B', 'fake@test.com', '444', 'Fake')$$,
  42501, NULL,
  'User A cannot insert profile with User B user_id');

-- ─── UPDATE ─────────────────────────────────────────────────────────────────

SELECT lives_ok(
  $$UPDATE profiles SET name = 'User A Updated' WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  'User A can update own profile');

SELECT results_eq(
  $$with updated as (
      update profiles set name = 'Hacked'
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from updated$$,
  $$select 0::int$$,
  'User A cannot update User B profile (0 rows affected)');

SELECT throws_ok(
  $$UPDATE profiles SET user_id = '22222222-2222-2222-2222-222222222222'
    WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  42501, NULL,
  'User A cannot change profile user_id to User B');

-- ─── DELETE ─────────────────────────────────────────────────────────────────

SELECT results_eq(
  $$with deleted as (
      delete from profiles
      where user_id = '22222222-2222-2222-2222-222222222222'
      returning 1
    ) select count(*)::int from deleted$$,
  $$select 0::int$$,
  'User A cannot delete User B profile (0 rows affected)');

-- ─── Finish ─────────────────────────────────────────────────────────────────

SELECT finish();
ROLLBACK;
