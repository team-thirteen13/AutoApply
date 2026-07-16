# External Integrations

**Analysis Date:** 2026-07-16

## APIs & External Services

**Supabase Platform:**
- Authentication - Email/password, Google OAuth
  - Client: `@supabase/ssr` (server and browser variants)
  - Auth implementation: `src/features/auth/` (signUp, signIn, signOut, startGoogleOAuth, exchangeOAuthCode)
  - Session handling: `src/lib/supabase/session.ts`
  - Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

- Database - PostgreSQL with Row Level Security (RLS)
  - Client: `@supabase/supabase-js` v2 via server/browser clients
  - Schema: `supabase/migrations/` (13 migrations)
  - Tables: `profiles`, `experiences`, `education`, `projects`, `certificates`, `skills`, `user_skills`, `resumes`, `resume_versions`
  - Access pattern: Server-side via `src/lib/supabase/server.ts`, client-side via `src/lib/supabase/client.ts`
  - RLS policies: All tables enforced with `auth.uid() = user_id` ownership rules

- Storage - File storage for resumes (implied by `supabase/migrations/20260712100000_create_resume_storage.sql`)
  - Client: `@supabase/supabase-js` storage API
  - Storage bucket: Resume file uploads

**AI Provider Interface (Planned):**
- Mock provider implemented: `src/lib/ai/mock-provider.ts` - `MockAIProvider` class
- Interface defined: `src/lib/ai/types.ts` - `AIProvider` interface with methods:
  - `improveSummary()` - Enhance bio/summary text
  - `improveExperience()` - Enhance experience bullet points and skills
  - `improveSkills()` - Deduplicate and organize skills list
  - `generateResume()` - Generate complete resume from career data
- Real providers (to be implemented by Member 3):
  - Groq
  - Google Gemini
  - OpenRouter
  - OpenAI

**Google OAuth:**
- Provider: Google OAuth 2.0
- Endpoints:
  - Start OAuth: `src/app/api/auth/oauth/google/route.ts` (POST)
  - Exchange code: `src/app/api/auth/oauth/exchange/route.ts` (POST)
- Implementation: `src/features/auth/start-google-oauth.ts`, `src/features/auth/exchange-oauth-code.ts`

## Data Storage

**Databases:**
- PostgreSQL (via Supabase hosted instance)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (Supabase handles connection pooling)
  - Client: `@supabase/supabase-js` with SSR support
  - Schema management: `supabase/migrations/` (timestamped SQL files)
  - Local dev: Supabase CLI with `supabase/config.toml` (port 54322)

**File Storage:**
- Supabase Storage (Resume file uploads)
  - Bucket: Configured in Supabase dashboard
  - Client: `@supabase/supabase-js` storage methods
  - Implementation: `src/features/resume-storage/`

**Caching:**
- None detected (application state managed via React state and Supabase real-time if enabled)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Email/Password authentication
  - Google OAuth 2.0 integration
  - Server-side session management via cookies
  - Implementation: `src/features/auth/`
  - API routes: `src/app/api/auth/` (sign-up, sign-in, sign-out, oauth/google, oauth/exchange)

**Session Management:**
- Server-side sessions via `@supabase/ssr` with cookie handling
- Browser client for client-side operations
- Session helper: `src/lib/supabase/session.ts` - `getAuthenticatedUser()`, `requireAuthenticatedUser()`

**Authorization:**
- Row Level Security (RLS) on all database tables
- Ownership rule: `auth.uid() = user_id` (user can only access their own data)
- All queries automatically filtered by Supabase RLS policies

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or similar integration)

**Logs:**
- Console-based logging only (standard `console.log/error`)
- Error boundaries in Next.js pages: `src/app/error.tsx`, `src/app/dashboard/error.tsx`

**Analytics:**
- None detected

## CI/CD & Deployment

**Hosting:**
- Docker-based (Node.js 20 Alpine)
- Local dev via `docker compose` with `npm run docker:dev`
- Production deployment: Presumably Vercel or similar (Next.js optimized)

**CI Pipeline:**
- GitHub Actions: `.github/workflows/ci.yml`
- Triggers: Push to `main` or `feat/*`, PRs to `main`
- Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. `npm ci` (install dependencies)
  4. `npm run lint` (ESLint)
  5. `npm run typecheck` (TypeScript)
  6. `npm run build` (Next.js build)
- Note: Tests not run in CI (only lint, typecheck, build)

**Additional Workflows:**
- `.github/workflows/backlog-proposal.yml` - Backlog management
- `.github/workflows/project-automation.yml` - Project board automation

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/publishable key
- `APP_URL` - Application base URL (defaults to `http://localhost:3000`)

**Optional/Planned:**
- AI provider API keys (Groq, Gemini, OpenRouter, OpenAI) - To be added by Member 3
- Google OAuth client credentials (managed via Supabase dashboard)

**Secrets location:**
- `.env` file (never committed, in `.gitignore`)
- `.env.example` - Template with placeholder values
- Environment validated at startup via Zod schema (`src/lib/env.ts`)
- CI uses placeholder values for build

## Webhooks & Callbacks

**Incoming:**
- Auth callback: `src/app/auth/callback/route.ts` - Handles OAuth redirect callbacks from Supabase

**Outgoing:**
- None detected (standard HTTP requests to Supabase APIs)

## Database Schema & Migrations

**Migration Files:** `supabase/migrations/`
```
20260711162314_create_profiles.sql
20260711163941_create_experiences_and_education.sql
20260711164453_create_projects_and_certificates.sql
20260711165130_create_skills.sql
20260711165842_create_profile_rls.sql
20260711170000_create_career_data_rls.sql
20260711171000_create_skills_rls.sql
20260711172000_grant_table_permissions.sql
20260712000000_create_resumes.sql
20260712000001_create_resume_rls.sql
20260712000002_grant_resume_permissions.sql
20260712100000_create_resume_storage.sql
20260713000000_create_profile_trigger.sql
```

**Key Tables:**
- `profiles` - User profile information
- `experiences` - Work experience entries
- `education` - Education entries
- `projects` - Project entries
- `certificates` - Certificate entries
- `skills` - Skill catalog
- `user_skills` - User-skill associations
- `resumes` - Resume configurations
- `resume_versions` - Resume version snapshots

---

*Integration audit: 2026-07-16*
