# Codebase Concerns

**Analysis Date:** 2026-07-16

## Tech Debt

**Resume Preview Component Duplication:**
- Issue: Three resume templates (Classic, Modern, Minimal) in `src/components/preview/resume-preview.tsx` contain nearly identical logic (170-250 lines each) with only color palette differences
- Files: `src/components/preview/resume-preview.tsx`
- Impact: Duplicating ~400 lines of JSX across templates makes maintenance error-prone and increases bundle size unnecessarily
- Fix approach: Extract a `ResumeTemplateRenderer` component that accepts a theme/palette object and renders all sections, with template-specific styling applied via props or CSS variables

**Resume Builder Component Complexity:**
- Issue: `ResumeBuilder` component at 615 lines manages 15+ state variables, 8 section form handlers, and 4 async operations in a single file
- Files: `src/components/builder/resume-builder.tsx`
- Impact: Difficult to test, understand, and modify; high cognitive load for developers
- Fix approach: Extract section-specific logic into custom hooks (e.g., `useResumeValidation`, `useVersionHistory`, `useAIImprovement`); reduce state management complexity with a reducer pattern or state machine

**Hardcoded Mock AI Provider in Production:**
- Issue: `MockAIProvider` is directly instantiated in `src/app/resumes/actions.ts` with no mechanism to swap real providers (Member 3's work)
- Files: `src/app/resumes/actions.ts:32`
- Impact: AI features cannot function with real providers in production; blocks Member 3 from integrating Groq, Gemini, OpenAI, OpenRouter
- Fix approach: Use dependency injection or environment-based provider selection; create an AI provider factory that reads from config or uses feature flags

## Known Bugs

**Incomplete Error Handling in Profile Save:**
- Symptoms: Profile form has empty catch block that silently swallows errors
- Files: `src/components/profile/profile-form.tsx` (implied from structure)
- Trigger: Profile save fails due to database or network error
- Workaround: Users may see success toast without data being persisted; no current workaround
- Recommendation: Add proper error handling with toast notification for save failures

**Validation Inconsistency Between Builder and Actions:**
- Symptoms: Builder form validation (Zod schema) accepts different data than server action validation
- Files: `src/lib/validation/builder.ts`, `src/app/resumes/actions.ts:264-278`
- Trigger: User submits data that passes client validation but fails server validation
- Workaround: Server-side validation is more restrictive, so server errors are shown but user context is lost
- Recommendation: Align validation schemas; ensure server validates all client-accepted data

## Security Considerations

**No Rate Limiting on Server Actions:**
- Risk: Server actions for resume creation, AI generation, and file upload have no rate limiting, making them vulnerable to abuse
- Files: `src/app/resumes/actions.ts`, `src/app/resumes/` directory
- Current mitigation: Authentication required for all actions, but no per-user or per-IP limits
- Recommendations: Add rate limiting middleware or use Supabase Edge Functions with rate limiting; implement per-user quotas for AI operations

**Missing Input Sanitization in Profile URLs:**
- Risk: Profile form accepts URLs without sanitization; malicious URLs could enable open redirect attacks or phishing
- Files: `src/components/profile/profile-form.tsx:28-38`, `src/lib/validation/profile.ts`
- Current mitigation: URL validation via `new URL()` constructor only
- Recommendations: Whitelist allowed URL schemes (http, https); validate against open redirect patterns; add CSP headers

**No CSRF Protection on Server Actions:**
- Risk: Next.js server actions are vulnerable to CSRF without explicit protection
- Files: `src/app/resumes/actions.ts`, all server actions
- Current mitigation: Next.js framework-level CSRF tokens for POST requests; server actions may not have same protection
- Recommendations: Add CSRF token validation in server actions; verify Next.js server action CSRF protection is active

**OAuth State Parameter Validation:**
- Risk: OAuth callback handler does not validate the state parameter, potentially vulnerable to CSRF during OAuth flow
- Files: `src/app/auth/callback/route.ts:17-23`
- Current mitigation: Code exchange requires valid Supabase auth state, but no explicit state validation
- Recommendations: Store and validate OAuth state parameter; implement PKCE flow with state validation

## Performance Bottlenecks

**Large Client Components with Frequent Re-renders:**
- Problem: `ResumeBuilder` and `ResumePreview` are "use client" components that manage significant state, causing frequent re-renders during form editing
- Files: `src/components/builder/resume-builder.tsx`, `src/components/preview/resume-preview.tsx`
- Cause: Many useState calls and derived state computations in same component; every keystroke triggers multiple state updates
- Improvement path: Memoize expensive computations with useMemo; use React.memo on ResumePreview to prevent unnecessary preview re-renders; extract form section components to reduce parent re-render scope

**Unoptimized Version List Loading:**
- Problem: `listVersionsAction` fetches all resume versions every time, but only version count is displayed
- Files: `src/app/resumes/actions.ts:42-44`, `src/components/builder/resume-builder.tsx:224-232`
- Cause: Eager loading of full version data when only count is needed initially
- Improvement path: Create a separate `listVersionsCountAction` that returns only count; lazy-load full version data when history panel opens

**No Lazy Loading of Preview Templates:**
- Problem: All three resume templates (Classic, Modern, Minimal) are imported and bundled together, but only one is used
- Files: `src/components/preview/resume-preview.tsx`
- Cause: Static import of all template components regardless of which template is active
- Improvement path: Use dynamic imports with `next/dynamic` for template-specific rendering; load only the selected template on-demand

## Fragile Areas

**Mock Provider Dependency in Production:**
- Files: `src/app/resumes/actions.ts:32`, `src/lib/ai/mock-provider.ts`
- Why fragile: Mock provider is not designed for production use; AI features will return static or dummy data in production
- Safe modification: Only modify provider initialization logic when adding new provider; keep mock provider as fallback for development only
- Test coverage: Mock provider has dedicated tests but no integration tests for provider switching

**Validation Schema Duplication:**
- Files: `src/lib/validation/builder.ts`, `src/lib/validation/profile.ts`, `src/lib/validation/experience.ts`
- Why fragile: Validation rules are duplicated between client and server; changes in one location may not propagate to all validation points
- Safe modification: Always update both client (Zod schemas) and server actions when modifying validation; add integration tests that verify client-server validation alignment
- Test coverage: Validation schema tests exist but don't verify client-server consistency

**Component State Propagation:**
- Files: `src/components/builder/resume-builder.tsx`, `src/components/preview/resume-preview.tsx`
- Why fragile: State flows from ResumeBuilder to ResumePreview via props; snapshot updates trigger full preview re-renders
- Safe modification: Keep state updates immutable; avoid mutating snapshot object directly; test all form sections for correct state propagation
- Test coverage: Component tests exist but don't fully test state management integration

## Scaling Limits

**Version History Growth:**
- Current capacity: No explicit limit on resume versions; database allows unlimited versions
- Limit: Performance degrades with hundreds of versions; list queries slow down; storage increases
- Scaling path: Implement version pruning/archival strategy; add soft delete and archive mechanism; limit active versions to reasonable number (e.g., 100 per resume)

**File Upload Size and Count:**
- Current capacity: Single file upload per resume; file size limits depend on Supabase storage config
- Limit: Multiple large files will exceed storage quotas; no validation on total storage per user
- Scaling path: Add per-user storage limits; validate file size and count before upload; implement file cleanup/archival for old resumes

**AI Generation Response Time:**
- Current capacity: Mock provider returns immediately; real providers may take 5-30 seconds
- Limit: Timeout on server actions; user experience degrades with slow AI responses
- Streaming support: No streaming implemented for AI responses; entire response is awaited
- Scaling path: Implement streaming for AI generation; add loading states and progress indicators; set appropriate timeout values (60-120 seconds for generation)

## Dependencies at Risk

**Next.js 16 (Beta):**
- Risk: Next.js 16.2.10 is a beta release; may have breaking changes or bugs before stable release
- Impact: Build failures, runtime errors, or performance issues with framework updates
- Migration plan: Pin to stable Next.js version; test thoroughly before upgrading; monitor Next.js release notes for breaking changes

**@supabase/ssr 0.12:**
- Risk: Supabase SSR library is relatively new; API may change or deprecate features
- Impact: Auth flow or cookie management may break with library updates
- Migration plan: Follow Supabase changelog; test auth flows with library updates; have rollback plan if update causes issues

**Zod 4.x (Beta):**
- Risk: Zod 4 is in beta; type inference and validation behavior may change
- Impact: Type mismatches or validation failures after upgrade; build errors with stricter type checking
- Migration plan: Pin to stable Zod 3.x; test all validation schemas after upgrade; update type definitions as needed

## Missing Critical Features

**No Error Monitoring or Observability:**
- Problem: No Sentry, Datadog, or error monitoring service integrated; production errors are not tracked
- Blocks: Cannot identify or diagnose issues in production; no way to measure error rates or performance
- Recommendation: Add error monitoring (Sentry or similar); implement performance tracking; add analytics for AI feature usage

**No Rate Limiting Infrastructure:**
- Problem: No rate limiting middleware or service; server actions are vulnerable to abuse
- Blocks: Cannot enforce usage quotas for AI features; users can abuse file uploads or resume creation
- Recommendation: Add rate limiting via Supabase Edge Functions or Redis-based solution; implement per-user quotas; add usage tracking

**No Audit Logging:**
- Problem: No audit trail for data changes; no tracking of who modified what and when
- Blocks: Cannot troubleshoot data issues; no compliance trail for GDPR or similar requirements
- Recommendation: Add audit logging for all CRUD operations; implement version history tracking; add data change notifications

**No Backup and Recovery Strategy:**
- Problem: No automated backups; Supabase backups only cover database, not file storage
- Blocks: Cannot recover from data loss or corruption; no disaster recovery plan
- Recommendation: Implement automated database backups; add file storage backup strategy; create recovery procedures and test them

## Test Coverage Gaps

**Integration Tests for Server Actions:**
- What's not tested: Server action integration with actual Supabase calls; end-to-end flow from UI to database
- Files: `src/app/resumes/actions.ts`, `src/features/resume/*.ts`
- Risk: Server actions may fail in production with real database; mock tests don't catch integration issues
- Priority: High

**OAuth Flow Integration Tests:**
- What's not tested: Complete OAuth flow from provider redirect to session creation; state parameter handling
- Files: `src/app/auth/callback/route.ts`
- Risk: OAuth flow may break in production with real providers; CSRF or state validation issues not caught
- Priority: High

**File Upload Security Tests:**
- What's not tested: File upload validation, malicious file detection, storage quota enforcement
- Files: `src/features/resume-storage/upload-resume-file.ts`
- Risk: Malicious files could be uploaded; storage limits not enforced; security vulnerabilities in file handling
- Priority: Medium

**Performance and Load Tests:**
- What's not tested: Application behavior under load; version list performance with many versions; AI generation response times
- Files: Entire application
- Risk: Application may be slow or unresponsive under user load; database queries may timeout with large datasets
- Priority: Medium

**Edge Case Validation Tests:**
- What's not tested: Input with special characters, unicode, very long strings, malformed data
- Files: `src/lib/validation/*.ts`, `src/components/builder/sections/*.tsx`
- Risk: Validation may fail with unusual input; special characters could cause XSS or injection vulnerabilities
- Priority: Medium

---

*Concerns audit: 2026-07-16*
