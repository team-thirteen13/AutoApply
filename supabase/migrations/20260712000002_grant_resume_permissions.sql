-- ─────────────────────────────────────────────────────────────
-- GRANT permissions for resumes and resume_versions
-- ─────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.resume_versions TO authenticated;
