---
refreshed: 2026-07-16
---
# Architecture

**Analysis Date:** 2026-07-16

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                  src/app/ (Pages & Routes)                   │
├──────────────────┬──────────────────┬───────────────────────┤
│   Page Routes    │  API Routes      │   Components          │
│   (SSR/CSR)      │  (REST)          │   (UI Layer)          │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feature Layer                             │
│         src/features/ (Domain Logic)                        │
│    auth, profile, resume, experience, education,            │
│    project, certificate, skill, ai, resume-version,        │
│    resume-storage                                           │
└─────────────────────────────────────────────────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                         │
│              src/lib/ (Shared Utilities)                     │
│    supabase, validation, ai, templates, env,                 │
│    date-normalize, skills-normalize                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                  │
│         Supabase (Auth, Database, Storage)                  │
│         supabase/migrations/ (Schema)                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App Routes | Page rendering, user-facing UI, server components | `src/app/` |
| API Routes | Backend REST endpoints, JSON responses | `src/app/api/` |
| Features | Domain logic, CRUD operations, data access | `src/features/` |
| Components | Reusable UI building blocks, presentational | `src/components/` |
| Lib - Supabase | Client/session management, proxy auth | `src/lib/supabase/` |
| Lib - Validation | Zod schemas for all data inputs | `src/lib/validation/` |
| Lib - AI | Provider interface, mock implementation | `src/lib/ai/` |
| Lib - Templates | Resume template registry and normalization | `src/lib/templates/` |
| Types | Shared TypeScript type contracts | `src/types/` |
| Proxy | Route protection middleware | `src/proxy.ts` |

## Pattern Overview

**Overall:** Layered Architecture with Feature-Based Organization

**Key Characteristics:**
- Server-first with Client Components for interactivity
- Feature modules encapsulate domain logic
- Result types replace exceptions for error handling
- Auth verification happens at proxy + session layers
- Zod validation at feature boundaries
- Supabase RLS provides database-level security

## Layers

**Presentation Layer (Pages & Components):**
- Purpose: User interface, rendering, and user interaction
- Location: `src/app/`, `src/components/`
- Contains: React components (Server + Client), page definitions, layouts, route handlers
- Depends on: Features layer, Lib layer
- Used by: Users via browser

**Feature Layer (Domain Logic):**
- Purpose: Business logic, CRUD operations, data access
- Location: `src/features/`
- Contains: Domain operations (create, update, delete, list, get) with auth and validation
- Depends on: Lib layer (Supabase, validation), Types
- Used by: Pages, API routes, other features

**Infrastructure Layer (Shared Utilities):**
- Purpose: Reusable infrastructure code
- Location: `src/lib/`
- Contains: Supabase clients, validation schemas, AI provider interface, templates, env, normalization utilities
- Depends on: External packages (Supabase, Zod)
- Used by: Features, Pages, API routes

**Data Layer:**
- Purpose: Persistent storage and authentication
- Location: Supabase (external), `supabase/migrations/`
- Contains: PostgreSQL schema, RLS policies, auth, storage
- Depends on: Supabase infrastructure
- Used by: Lib layer (Supabase clients)

## Data Flow

### Primary Request Path (Authenticated Page)

1. Browser requests `/dashboard` → `src/proxy.ts` intercepts
2. Proxy validates session via Supabase `getUser()` → `src/lib/supabase/proxy.ts`
3. If authenticated, continues to route rendering → `src/app/dashboard/page.tsx`
4. Server component fetches profile via feature → `src/features/profile/get-profile.ts`
5. Server component fetches resumes via feature → `src/features/resume/list-resumes.ts`
6. Feature validates auth via `requireAuthenticatedUser()` → `src/lib/supabase/session.ts`
7. Feature queries Supabase with RLS filtering → `src/lib/supabase/server.ts`
8. Returns typed result → `ExperienceOperationResult<T>` pattern
9. Server component renders with data → UI components in `src/components/`

### API Request Path (e.g., Sign Up)

1. Client POSTs to `/api/auth/sign-up` → `src/app/api/auth/sign-up/route.ts`
2. Route handler reads JSON body via shared helper → `src/app/api/auth/_shared/http.ts`
3. Calls feature function → `src/features/auth/sign-up.ts`
4. Feature validates input via Zod → `src/lib/validation/auth.ts`
5. Feature calls Supabase auth → `src/lib/supabase/server.ts`
6. Returns `AuthOperationResult<T>` → Success or structured error
7. Route handler converts to JSON response → `authJsonResponse()`

### Client-Initiated Action Path (e.g., Delete Resume)

1. User clicks delete on `ResumeCard` → `src/components/dashboard/resume-card.tsx`
2. Component calls server action → `src/app/dashboard/actions.ts`
3. Server action calls feature → `src/features/resume/delete-resume.ts`
4. Feature validates auth, ownership, and deletion → `src/lib/supabase/session.ts`
5. Feature deletes from Supabase → Returns result
6. Server action returns result → Component updates UI state
7. Component shows error toast or confirms success

**State Management:**
- Server Components: No client state, data fetched at render
- Client Components: React `useState`/`useReducer` for UI state
- No global state store (Redux, Context) in use
- Server Actions for mutations (no client-side state library)

## Key Abstractions

**Result Type Pattern:**
- Purpose: Type-safe error handling without exceptions
- Examples: `src/types/auth.ts` (`AuthOperationResult<T>`), `src/types/experience.ts` (`ExperienceOperationResult<T>`)
- Pattern: `{ success: true; data: T } | { success: false; error: { code: string; message: string } }`

**Feature Module:**
- Purpose: Domain logic encapsulation
- Examples: `src/features/experience/`, `src/features/resume/`, `src/features/auth/`
- Pattern: One directory per domain, contains CRUD operations + mapper, exported via `index.ts`

**Zod Schema Validation:**
- Purpose: Input validation at feature boundaries
- Examples: `src/lib/validation/experience.ts`, `src/lib/validation/resume.ts`
- Pattern: Schema per domain (create, update, ID), exported with inferred TypeScript types

**Server-Only Guard:**
- Purpose: Prevent client-side imports of server code
- Examples: All feature operations, session utilities
- Pattern: `import "server-only"` at top of file

**Supabase Client Variants:**
- Purpose: Different cookie handling for different contexts
- Examples: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server), `src/lib/supabase/proxy.ts` (proxy/middleware)
- Pattern: `createClient()` for server, `createBrowserClient()` for client, `createProxyClient()` for proxy

## Entry Points

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Landing page, auth state detection, routing to dashboard or login/register

**Proxy (Route Protection):**
- Location: `src/proxy.ts`
- Triggers: All requests except API, static assets, public routes
- Responsibilities: Validates session, redirects unauthenticated users to `/login`

**Dashboard Page:**
- Location: `src/app/dashboard/page.tsx`
- Triggers: Authenticated users navigating to `/dashboard`
- Responsibilities: Lists resumes, shows stats, profile welcome message

**API Auth Routes:**
- Location: `src/app/api/auth/`
- Triggers: Client-side fetch requests (sign-up, sign-in, sign-out, OAuth)
- Responsibilities: Handles auth operations, returns JSON responses

**Server Actions:**
- Location: `src/app/*/actions.ts` (e.g., `src/app/dashboard/actions.ts`)
- Triggers: Client component function calls
- Responsibilities: Handle mutations, call features, return results

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js runtime). All async operations via Promises.
- **Global State:** No module-level singletons. Each request gets fresh clients via `createClient()`.
- **Circular Imports:** None. Clear dependency direction: Pages → Features → Lib → External.
- **Server-Client Boundary:** Strict separation. Server components never passed to client components as props (only serializable data).
- **Auth Boundary:** Proxy checks session validity; Features verify user ownership via RLS. Two layers of protection.
- **Type Safety:** Zod schemas generate TypeScript types. No runtime type assertions without validation.

## Anti-Patterns

### Direct Supabase Client in Pages

**What happens:** Pages import `createClient` directly and query database
**Why it's wrong:** Bypasses feature layer, duplicates logic, hard to test
**Do this instead:** Import feature operations from `src/features/` (e.g., `getProfile()` from `src/features/profile/`)

### Unprotected Feature Calls

**What happens:** Feature called without authentication check
**Why it's wrong:** RLS blocks unauthorized access but feature returns confusing error
**Do this instead:** Call `requireAuthenticatedUser()` early in feature for clear error messages (see `src/features/experience/create-experience.ts`)

### Client-Side Auth State from Cookies

**What happens:** Client reads cookies to determine auth state
**Why it's wrong:** Cookies can be manipulated; not secure
**Do this instead:** Use `getAuthenticatedUser()` in server components (validates JWT server-side)

### Manual Input Validation

**What happens:** Manual `if (name.length === 0)` checks
**Why it's wrong:** Inconsistent, hard to maintain, error-prone
**Do this instead:** Use Zod schemas from `src/lib/validation/` (e.g., `createExperienceSchema.safeParse(input)`)

### Throwing Exceptions for Flow Control

**What happens:** Features throw exceptions for expected failures
**Why it's wrong:** Callers must catch; error types lost; stack traces noisy
**Do this instead:** Return structured result types with error codes (see `AuthOperationResult<T>` in `src/types/auth.ts`)

## Error Handling

**Strategy:** Structured result types for expected failures; exceptions for unexpected/catastrophic failures

**Patterns:**
1. **Result Types:** `{ success: true; data } | { success: false; error: { code, message } }` — used by all feature operations
2. **Error Code Enums:** Typed error codes (`AuthErrorCode`) allow programmatic handling without string matching
3. **Early Return:** Features validate auth first, then validate input, then execute — each returns early on failure
4. **Error Boundaries:** `src/app/error.tsx`, `src/app/dashboard/error.tsx` catch unhandled exceptions
5. **HTTP Response Helpers:** `authJsonResponse()` in `src/app/api/auth/_shared/http.ts` standardizes API error responses

## Cross-Cutting Concerns

**Logging:** Console-based (no logging library). Used for development debugging only.

**Validation:** Zod schemas in `src/lib/validation/`. Every feature operation validates input before auth/DB access.

**Authentication:** Supabase Auth with JWT validation. Three layers:
1. Proxy (`src/proxy.ts`) — Route protection, session verification
2. Session utilities (`src/lib/supabase/session.ts`) — User retrieval, auth guards
3. Feature operations — Call `requireAuthenticatedUser()` to enforce auth

**Authorization:** Supabase RLS policies in `supabase/migrations/`. Each table enforces `auth.uid() = user_id` ownership.

**Data Normalization:** Utility functions in `src/lib/`:
- `src/lib/date-normalize.ts` — Date string normalization
- `src/lib/skills-normalize.ts` — Skills array normalization

---

*Architecture analysis: 2026-07-16*
