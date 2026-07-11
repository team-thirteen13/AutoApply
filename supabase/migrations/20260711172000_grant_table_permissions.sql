-- =============================================================================
-- Grant base table permissions to authenticated role.
-- RLS policies control WHICH rows are visible; GRANT controls WHETHER
-- the role can access the table at all. Both are required.
-- =============================================================================

-- public.profiles (full CRUD — RLS enforces owner-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- public.experiences (full CRUD — RLS enforces owner-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiences TO authenticated;

-- public.education (full CRUD — RLS enforces owner-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO authenticated;

-- public.projects (full CRUD — RLS enforces owner-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- public.certificates (full CRUD — RLS enforces owner-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;

-- public.skills (read + create only — no UPDATE or DELETE policies exist)
GRANT SELECT, INSERT ON public.skills TO authenticated;

-- public.user_skills (read + create + remove only — no UPDATE policy exists)
GRANT SELECT, INSERT, DELETE ON public.user_skills TO authenticated;
