# Coding Conventions

**Analysis Date:** 2026-07-16

## Naming Patterns

**Files:**
- Kebab-case for TypeScript modules: `create-experience.ts`, `skills-normalize.ts`, `resume-storage-path.ts`
- PascalCase for React components: `ResumeCard`, `ProfileForm`, `ConfirmDialog`
- Suffix pattern for server actions: `save-resume-action`, `delete-resume-action`
- Test files: `*.test.ts`, `*.test.tsx` (co-located in `src/test/` or `__tests__/` directories)

**Functions:**
- camelCase for all functions: `createExperience()`, `getAuthenticatedUser()`, `normalizeSkills()`
- Verbs for actions: `createExperience`, `deleteResume`, `listExperiences`
- Accessor prefixes: `get` for reads, `create`/`update`/`delete` for mutations

**Variables:**
- camelCase for variables and object properties: `mockGetUser`, `VALID_UUID`, `experienceData`
- UPPER_SNAKE_CASE for constants: `EXPERIENCE_COLUMNS`, `GREETING`
- Prefix mocks with `mock`: `mockFrom`, `mockSelect`, `mockInsert`

**Types:**
- PascalCase for all types and interfaces: `Profile`, `AuthUser`, `ResumeSnapshot`
- Prefix error types: `ProfileError`, `AuthError`, `ResumeError`
- Prefix error codes: `ProfileErrorCode`, `AuthErrorCode`, `ResumeErrorCode`
- Prefix result types: `ProfileOperationResult<T>`, `AuthOperationResult<T>`
- Suffix input types: `CreateExperienceInput`, `SignInInput`

**Database/SQL:**
- snake_case for all SQL: `user_id`, `created_at`, `experiences` (per CLAUDE.md)
- camelCase for TypeScript types derived from DB: `userId`, `createdAt`

## Code Style

**Formatting:**
- ESLint with `eslint-config-next` and TypeScript support
- Strict mode enabled in TypeScript (`tsconfig.json`)
- No Prettier configured (use editor defaults)
- 2-space indentation

**Linting:**
- Config: `eslint.config.mjs`
- Rules: Next.js Core Web Vitals + TypeScript rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**TypeScript:**
- Strict mode with all strict checks enabled
- No emit (type checking only): `"noEmit": true`
- ESM modules: `"module": "esnext"`, `"moduleResolution": "bundler"`
- Path alias: `@/*` maps to `src/*`

## Import Organization

**Order:**
1. Node modules and external packages: `"server-only"`, `"next/link"`, `"lucide-react"`, `"zod"`
2. Absolute aliases using `@/`: `"@/lib/supabase/server"`, `"@/types/auth"`, `"@/features/experience/..."` 
3. Relative imports: `"./experience-map"`, `"../skills-normalize"`

**Path Aliases:**
- Primary: `@/` → `src/` (configured in `tsconfig.json` and `vitest.config.ts`)
- Use absolute imports with `@/` for all internal imports (avoid relative paths except for same-directory)

**Import Style:**
- Named imports for types: `import type { Experience } from "@/types/experience"`
- Named imports for functions: `import { createExperience } from "./experience-map"`
- Barrel files: Use `index.ts` to re-export public API of each feature module

## Error Handling

**Patterns:**

**Result Types (Preferred for async operations):**
```typescript
export type ExperienceOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ExperienceError };
```

**Error Codes as String Literals:**
```typescript
export type ExperienceErrorCode =
  | "authentication_required"
  | "validation_error"
  | "unexpected";
```

**Error Classes (For authentication guards that throw):**
```typescript
export class AuthenticationRequiredError extends Error {
  readonly code = "session_missing" as const;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}
```

**Try-Catch Pattern:**
```typescript
try {
  const user = await requireAuthenticatedUser();
  // ... business logic
} catch (error) {
  if (error instanceof AuthenticationRequiredError) {
    return { success: false, error: { code: "authentication_required", message: error.message } };
  }
  return { success: false, error: { code: "unexpected", message: "An unexpected error occurred" } };
}
```

**Validation Pattern (Zod):**
```typescript
const parsed = createExperienceSchema.safeParse(input);
if (!parsed.success) {
  return { success: false, error: { code: "validation_error", message: "Invalid experience data" } };
}
```

## Validation

**Framework:** Zod (v4.4.3)
- Config: `src/lib/validation/`
- Schemas for all input validation: `experience.ts`, `profile.ts`, `auth.ts`
- Export both schema and inferred type: `export type CreateExperienceInput = z.infer<typeof createExperienceSchema>`
- Strict mode: Use `.strict()` on object schemas to reject unknown keys
- Custom refinements: `isoDateSchema` for strict YYYY-MM-DD validation

**Schema Design:**
- Compose reusable validators (e.g., `experienceStringArraySchema`, `isoDateSchema`)
- Use `.refine()` for cross-field validation (e.g., `isCurrent` and `endDate` relationship)
- Separate schemas for create vs update operations: `createExperienceSchema`, `updateExperienceSchema`
- Optional fields: Use `.optional()` consistently (never undefined in required fields)

## Comments

**When to Comment:**
- File headers with module purpose (consistent format)
- Complex logic or business rules (e.g., date validation, error mapping)
- Public API interfaces and exported functions

**File Header Format:**
```typescript
// ─────────────────────────────────────────────────────────────
// [Module Name]
// ─────────────────────────────────────────────────────────────
// [Brief description of what this module does]
// [Context about who uses it or when]
// ─────────────────────────────────────────────────────────────
```

**Section Dividers:**
```typescript
// ── [Section Name] ──────────────────────────────────────────
```

**JSDoc/TSDoc:**
- Use `/** @description */` for public functions and interfaces
- Use inline comments for business logic or edge cases
- Example from `mock-provider.ts`:
```typescript
/**
 * Deterministic mock implementation of AIProvider for testing
 * and development. Returns realistic but static responses.
 * No external API calls — safe to run in any environment.
 */
```

## Function Design

**Size:**
- Keep functions focused: 15-50 lines typically
- Extract helper functions for complex logic
- Single Responsibility: Each function does one thing

**Parameters:**
- Single input parameter for complex data (use `input: unknown` and validate with Zod)
- Multiple parameters only for simple cases: `id: string`, `label: string | null`
- Use typed interfaces instead of primitive objects

**Return Values:**
- Return `Promise<T>` for async operations
- Use result types for operations that can fail: `ExperienceOperationResult<T>`
- Return `null` for optional finds (e.g., `getAuthenticatedUser(): Promise<AuthUser | null>`)
- Throw `Error` classes only for guard functions: `requireAuthenticatedUser()`

## Module Design

**Exports:**
- Single responsibility per file (one function or class per file)
- Barrel files (`index.ts`) for feature modules that group related exports
- Export types from dedicated type files: `src/types/`
- Avoid circular dependencies (use dependency injection or types-only imports)

**Feature Module Structure:**
```
src/features/experience/
├── index.ts                    # Public API (barrel file)
├── create-experience.ts        # Single responsibility: create
├── get-experience.ts           # Single responsibility: read
├── update-experience.ts        # Single responsibility: update
├── delete-experience.ts        # Single responsibility: delete
├── list-experiences.ts         # Single responsibility: list
├── experience-map.ts           # Data mapping/transformation
└── __tests__/                  # Tests (if co-located)
```

**Barrel File Pattern:**
```typescript
export { listExperiences } from "./list-experiences";
export { getExperience } from "./get-experience";
export { createExperience } from "./create-experience";
export { updateExperience } from "./update-experience";
export { deleteExperience } from "./delete-experience";
```

**Server vs Client Components:**
- Server-only modules: Use `"server-only"` directive at top of file
- Client components: Mark with `"use client"` directive
- Use `requireAuthenticatedUser()` only in server modules (throws on unauthenticated)
- Server actions: Handle auth and validation at action level, not in UI components

## Special Conventions

**Supabase Client Usage:**
- Import server client: `import { createClient } from "@/lib/supabase/server"`
- Always await: `const supabase = await createClient()`
- Chain queries: `supabase.from("experiences").select().eq().maybeSingle()`
- Handle errors: Check both `error` and `data` from response

**Auth Pattern:**
- Get user (returns null): `const user = await getAuthenticatedUser()`
- Require user (throws): `const user = await requireAuthenticatedUser()`
- Auth error handling: Catch `AuthenticationRequiredError` and return typed error result

**AI Provider Pattern:**
- Interface-based: `AIProvider` interface in `src/lib/ai/types.ts`
- Mock implementation: `MockAIProvider` for testing and development
- Type-safe results: `AIResult<T>` with data, provider name, and optional note
- Provider-agnostic: Code only depends on `AIProvider` interface

---

*Convention analysis: 2026-07-16*
