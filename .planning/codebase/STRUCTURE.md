# Codebase Structure

**Analysis Date:** 2026-07-16

## Directory Layout

```
AutoApply/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router (pages & API)
│   ├── features/                 # Domain modules (CRUD + logic)
│   ├── components/               # UI components (Server & Client)
│   ├── lib/                      # Shared utilities & infrastructure
│   ├── types/                    # TypeScript type definitions
│   ├── hooks/                    # React hooks
│   └── proxy.ts                  # Route protection middleware
├── supabase/                     # Database configuration
│   ├── migrations/               # SQL schema migrations
│   └── config.toml               # Supabase project settings
├── public/                       # Static assets
├── .github/                      # GitHub Actions workflows
├── scripts/                      # Project automation
├── docs/                         # Documentation
├── package.json                  # Dependencies & scripts
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Testing config
├── eslint.config.mjs             # Linting config
├── postcss.config.mjs            # CSS processing
├── compose.yaml                  # Docker development
└── CLAUDE.md                     # Claude Code instructions
```

## Directory Purposes

**src/app/:**
- Purpose: Next.js App Router pages, API routes, and layout
- Contains: Server components (pages), Client components (interactive), API route handlers, middleware/proxy
- Key files: `page.tsx` (home), `layout.tsx` (root layout), `loading.tsx`, `error.tsx`, `not-found.tsx`

**src/features/:**
- Purpose: Domain-specific business logic and data access
- Contains: Feature modules (one per domain), each with CRUD operations, mappers, and barrel exports
- Key files: `auth/`, `profile/`, `resume/`, `experience/`, `education/`, `project/`, `certificate/`, `skill/`, `ai/`, `resume-version/`, `resume-storage/`

**src/components/:**
- Purpose: Reusable UI building blocks
- Contains: Server and Client components organized by feature area
- Key files: `ui/` (base components), `auth/`, `dashboard/`, `profile/`, `ai/`, `preview/`, `builder/`

**src/lib/:**
- Purpose: Shared utilities, infrastructure code, and external integrations
- Contains: Supabase clients, validation schemas, AI provider interface, templates, environment, normalization utilities
- Key files: `supabase/`, `validation/`, `ai/`, `templates/`, `env.ts`, `date-normalize.ts`, `skills-normalize.ts`

**src/types/:**
- Purpose: Shared TypeScript type definitions
- Contains: Domain types, API types, auth types
- Key files: `auth.ts`, `resume.ts`, `experience.ts`, `education.ts`, `project.ts`, `certificate.ts`, `skill.ts`, `api.ts`, `profile.ts`, `resume-upload.ts`

**src/hooks/:**
- Purpose: Custom React hooks
- Contains: Reusable stateful logic for components
- Key files: `use-focus-trap.ts`

**supabase/migrations/:**
- Purpose: Database schema versioning and migrations
- Contains: Timestamped SQL migration files, RLS policies, triggers
- Key files: `20260711162314_create_profiles.sql` through `20260713000000_create_profile_trigger.sql`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Home page and landing route
- `src/proxy.ts`: Route protection middleware (Next.js 16 proxy)
- `src/app/dashboard/page.tsx`: Authenticated user dashboard
- `src/app/login/page.tsx`, `src/app/register/page.tsx`: Auth entry points
- `src/app/api/auth/sign-up/route.ts`, `src/app/api/auth/sign-in/route.ts`: Auth API endpoints

**Configuration:**
- `package.json`: Dependencies, scripts, project metadata
- `next.config.ts`: Next.js configuration with security headers
- `tsconfig.json`: TypeScript compiler configuration
- `vitest.config.ts`: Test runner configuration
- `eslint.config.mjs`: Linting rules
- `supabase/config.toml`: Supabase project settings

**Core Logic:**
- `src/features/*/index.ts`: Feature barrel exports (one per domain)
- `src/lib/supabase/server.ts`: Server-side Supabase client
- `src/lib/supabase/session.ts`: Auth session utilities
- `src/lib/ai/types.ts`: AI provider interface
- `src/lib/templates/registry.ts`: Resume template registry
- `src/lib/validation/*.ts`: Zod validation schemas

**Testing:**
- `src/test/*.test.ts(x)`: Integration and component tests
- `src/lib/__tests__/*.test.ts`: Unit tests for lib utilities
- `src/lib/validation/__tests__/*.test.ts`: Validation schema tests
- `src/lib/supabase/__tests__/*.test.ts`: Supabase client tests
- `supabase/tests/*.sql`: Database tests

## Naming Conventions

**Files:**
- Kebab-case for all files: `create-experience.ts`, `sign-up.ts`, `list-resumes.ts`
- Feature files: `{action}-{domain}.ts` pattern (e.g., `get-profile.ts`, `update-resume.ts`)
- Mappers: `{domain}-map.ts` (e.g., `experience-map.ts`, `resume-map.ts`)
- Index files: `index.ts` for barrel exports
- Test files: `{filename}.test.ts` or `{filename}.test.tsx`
- API routes: `route.ts` in directory structure (Next.js convention)

**Directories:**
- Kebab-case for all directories: `resume-storage/`, `resume-version/`
- Feature directories: singular domain name (`auth/`, `profile/`, `experience/`)
- Component directories: feature-based grouping (`dashboard/`, `auth/`, `ui/`)
- Test directories: `__tests__/` nested in source or `test/` at root

**Types:**
- PascalCase for interfaces and types: `AuthUser`, `Experience`, `ResumeOperationResult<T>`
- Suffix pattern: `*Input`, `*Output`, `*Result<T>`, `*Error`, `*ErrorCode`

**Functions:**
- camelCase: `createExperience()`, `getProfile()`, `listResumes()`
- CRUD pattern: `create*`, `get*`, `list*`, `update*`, `delete*`
- Auth pattern: `getAuthenticatedUser()`, `requireAuthenticatedUser()`

**SQL:**
- snake_case for tables and columns: `user_id`, `created_at`, `experiences`
- UUID primary keys: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`

## Where to Add New Code

**New Domain Feature (e.g., "job"):**
- Create feature directory: `src/features/job/`
- Add files: `create-job.ts`, `get-job.ts`, `list-jobs.ts`, `update-job.ts`, `delete-job.ts`
- Add mapper: `job-map.ts`
- Export via barrel: `src/features/job/index.ts`
- Add types: `src/types/job.ts`
- Add validation: `src/lib/validation/job.ts`
- Add database migration: `supabase/migrations/YYYYMMDDHHMMSS_create_jobs.sql`

**New Page/Route:**
- Add page component: `src/app/{route}/page.tsx`
- Add layout if needed: `src/app/{route}/layout.tsx`
- Add server actions: `src/app/{route}/actions.ts`
- Add error handling: `src/app/{route}/error.tsx`
- Add loading state: `src/app/{route}/loading.tsx`

**New API Route:**
- Add route handler: `src/app/api/{endpoint}/route.ts`
- Use shared HTTP helpers: `src/app/api/auth/_shared/http.ts`
- Call feature functions: Import from `src/features/`

**New UI Component:**
- Shared base components: `src/components/ui/`
- Feature-specific components: `src/components/{feature}/`
- Use `"use client"` directive for interactive components
- Server components for static/async data fetching

**New Validation Schema:**
- Add schema file: `src/lib/validation/{domain}.ts`
- Use Zod for schema definition
- Export inferred TypeScript types

**New Utility Function:**
- General utilities: `src/lib/{utility-name}.ts`
- Domain-specific normalization: `src/lib/{domain}-normalize.ts`

**New Hook:**
- Add hook file: `src/hooks/use-{hook-name}.ts`
- Use `"use client"` directive

**New Test:**
- Unit tests: `src/{module}/__tests__/{filename}.test.ts`
- Integration tests: `src/test/{test-name}.test.ts(x)`
- Component tests: `src/test/{component-name}.test.tsx`

## Special Directories

**src/features/:**
- Purpose: Domain logic modules with strict ownership boundaries
- Generated: No (manually maintained)
- Committed: Yes
- Note: Members have ownership (Member 1: auth, profile, resume; Member 3: AI, job)

**supabase/migrations/:**
- Purpose: Database schema changes (versioned SQL)
- Generated: Manually created or from Supabase CLI
- Committed: Yes
- Note: Timestamped, ordered, immutable

**src/components/ui/:**
- Purpose: Base reusable UI primitives (Button, Input, Select, etc.)
- Generated: No
- Committed: Yes
- Note: Member 2 owns; shared across all features

**public/:**
- Purpose: Static assets served at root URL
- Generated: No
- Committed: Yes
- Note: Images, favicons, robots.txt, etc.

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**.next/:**
- Purpose: Next.js build output and development cache
- Generated: Yes (via `npm run dev` or `npm run build`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-07-16*
