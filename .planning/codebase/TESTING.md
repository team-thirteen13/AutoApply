# Testing Patterns

**Analysis Date:** 2026-07-16

## Test Framework

**Runner:**
- Vitest v4.1.10
- Config: `vitest.config.ts`
- Environment: Node (default), jsdom (for React component tests)

**Assertion Library:**
- Vitest built-in (`expect()`)
- Extended with `@testing-library/jest-dom` for DOM matchers

**Run Commands:**
```bash
npm run test              # Run all tests
vitest --watch            # Watch mode
vitest run --coverage     # Run with coverage
```

## Test File Organization

**Location:**
- Component and integration tests: `src/test/`
- Unit tests: Co-located in `src/lib/__tests__/` or `src/features/[feature]/__tests__/`
- Fixtures: `src/test/fixtures/`

**Naming:**
- Files: `*.test.ts`, `*.test.tsx` (must match `src/**/*.test.ts` pattern in `vitest.config.ts`)
- Examples:
  - `src/test/cv-builder.test.ts`
  - `src/test/resume-card.test.tsx`
  - `src/lib/__tests__/skills-normalize.test.ts`
  - `src/features/resume-storage/__tests__/upload.test.ts`

**Structure:**
```
src/test/
├── setup.ts                          # Global test setup
├── fixtures/                         # Test data and fixtures
│   └── example.ts
├── cv-builder.test.ts               # Server action tests
├── resume-card.test.tsx              # React component tests
├── profile-page.test.tsx             # Page component tests
└── auth-error-mapping.test.ts       # Pure function tests

src/lib/__tests__/
└── skills-normalize.test.ts          # Unit tests

src/features/resume-storage/__tests__/
└── *.test.ts                         # Feature tests
```

## Test Setup

**Global Setup:**
- File: `src/test/setup.ts`
- Content: Imports `@testing-library/jest-dom/vitest` to add DOM matchers
- Loaded automatically via `vitest.config.ts` `setupFiles` option

**Per-Test Setup:**
- Use `beforeEach()` to:
  - Clear mocks: `vi.clearAllMocks()`
  - Set up default mock behaviors
  - Configure return values for common queries

**Cleanup:**
- React component tests: Import `cleanup` from `@testing-library/react` and call in `afterEach()`
- Always call `vi.clearAllMocks()` in `afterEach()` to prevent test pollution

## Test Structure

**Basic Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Feature or module name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up common state
  });

  afterEach(() => {
    cleanup(); // For React component tests
  });

  describe("specific behavior group", () => {
    it("does something when condition is met", async () => {
      // Arrange
      const input = { /* ... */ };
      
      // Act
      const result = await doSomething(input);
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});
```

**React Component Tests:**
```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// Mocks must be defined BEFORE imports that use them
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Import after mocks
import { MyComponent } from "@/components/my-component";

describe("MyComponent", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## Mocking

**Framework:** Vitest built-in (`vi.mock()`, `vi.fn()`)

**Module Mocking Pattern:**
```typescript
// Mock external modules
vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

// Mock internal modules
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Mock components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));
```

**Mock Function Setup:**
```typescript
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated user
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "test@example.com",
        email_confirmed_at: "2024-01-01",
        created_at: "2024-01-01",
      },
    },
    error: null,
  });

  // Chain Supabase query methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
  });
  mockEq.mockReturnValue({
    eq: mockEq,
    select: mockSelect,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
  });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
});
```

**What to Mock:**
- External dependencies: `"server-only"`, `"next/navigation"`, `"next/link"`
- Server-side calls: Supabase client, auth functions
- UI components: Complex child components, icons, dialogs
- Modules under test: Features, services, utilities

**What NOT to Mock:**
- Pure functions without side effects (test them directly)
- Types and interfaces (no runtime cost)
- Simple utility functions (keep tests focused)

## Test Data

**Inline Test Data Pattern:**
```typescript
// Valid UUID for testing
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// Mock resume object
const mockResume = {
  id: "resume-1",
  userId: "user-1",
  title: "Software Engineer Resume",
  targetRole: "Senior Developer",
  filePath: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
};

// Mock authenticated user
const mockUser = {
  id: "user-1",
  email: "test@example.com",
  emailConfirmed: true,
  createdAt: "2024-01-01T00:00:00Z",
};
```

**Test Fixtures:**
- Location: `src/test/fixtures/`
- Purpose: Reusable test data and helper functions
- Example:
```typescript
export const GREETING = "hello from fixture";

export function add(a: number, b: number): number {
  return a + b;
}
```

**Data Factories:**
- Create mock objects that match your interfaces
- Use defaults with optional overrides
- Keep test data realistic but simple

## Coverage

**Requirements:** None enforced (no coverage threshold in config)

**View Coverage:**
```bash
npm run test -- --coverage
```

**Coverage Setup:**
- Available via Vitest coverage provider
- Not configured in default setup
- Add to `vitest.config.ts` if needed:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/test/**"],
    },
  },
});
```

## Test Types

**Unit Tests:**
- Scope: Single function, pure logic, utilities
- Location: `src/lib/__tests__/`, `src/features/[feature]/__tests__/`
- Example: `skills-normalize.test.ts` tests `normalizeSkills()` function
- Pattern: Test edge cases, invalid inputs, success paths
- No mocking (pure functions only)

**Integration Tests:**
- Scope: Server actions, API routes, features with dependencies
- Location: `src/test/`, `src/features/[feature]/__tests__/`
- Example: `cv-builder.test.ts` tests server actions end-to-end
- Pattern: Mock external dependencies (Supabase, auth), test data flow
- Test multiple functions working together

**Component Tests:**
- Scope: React components (client and server)
- Location: `src/test/`, `src/components/__tests__/`
- Example: `resume-card.test.tsx` tests UI interactions
- Pattern: Render with `@testing-library/react`, fire events, assert DOM
- Use `@vitest-environment jsdom` directive

**Page Tests:**
- Scope: Next.js page components
- Location: `src/test/`
- Example: `profile-page.test.tsx`, `google-oauth-pages.test.tsx`
- Pattern: Mock auth and data fetching, test redirects and rendering

## Common Patterns

**Async Testing:**
```typescript
it("returns error when operation fails", async () => {
  // Arrange
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  
  // Act
  const result = await someAction(VALID_UUID);
  
  // Assert
  expect(result.success).toBe(false);
  expect(result.error?.code).toBe("validation_error");
});
```

**Testing Redirects:**
```typescript
it("redirects to dashboard after delete", async () => {
  mockMaybeSingle.mockResolvedValue({ data: { id: VALID_UUID }, error: null });
  
  await expect(deleteResumeAction(VALID_UUID)).rejects.toThrow("REDIRECT:/dashboard");
});
```

**Testing Thrown Errors:**
```typescript
it("throws AuthenticationRequiredError when not authenticated", async () => {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  
  await expect(
    EditResumePage({ params: Promise.resolve({ id: VALID_UUID }) }),
  ).rejects.toThrow("REDIRECT:/login");
});
```

**Testing UI Interactions:**
```typescript
it("opens menu when more options clicked", async () => {
  render(<ResumeCard resume={mockResume} />);
  
  const moreButton = screen.getByLabelText("More options");
  fireEvent.click(moreButton);

  await waitFor(() => {
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });
});
```

**Testing with Assertions on Results:**
```typescript
it("returns list of resumes", async () => {
  mockOrder.mockResolvedValue({
    data: [{ id: VALID_UUID, title: "My Resume" }],
    error: null,
  });

  const result = await listResumesAction();

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe("My Resume");
  }
});
```

**Testing Edge Cases:**
```typescript
it("returns empty array when no resumes exist", async () => {
  mockOrder.mockResolvedValue({ data: [], error: null });
  
  const result = await listResumesAction();
  
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual([]);
  }
});

it("returns error when resume not found", async () => {
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  
  const result = await someAction(VALID_UUID);
  
  expect(result.success).toBe(false);
});
```

**Testing Imports:**
```typescript
it("export page modules are functions", async () => {
  const newPage = await import("@/app/resumes/new/page");
  expect(typeof newPage.default).toBe("function");
});
```

**Error Message Testing:**
```typescript
it("invalid_credentials produces specific message", () => {
  const msg = getAuthErrorMessage("invalid_credentials");
  expect(msg).toBe("Invalid email or password. Please check your credentials and try again.");
  expect(msg).not.toContain("Something went wrong");
});

it("raw Supabase message is never returned", () => {
  const codes: AuthErrorCode[] = ["invalid_credentials", "email_exists"];
  for (const code of codes) {
    const msg = getAuthErrorMessage(code);
    expect(msg).not.toMatch(/Invalid login credentials/i);
    expect(msg).not.toMatch(/User already registered/i);
  }
});
```

**Testing Multiple Cases:**
```typescript
it("maps weak_password to weak_password", () => {
  expect(mapAuthErrorCode({ code: "weak_password" })).toBe("weak_password");
});

it("maps rate limit codes to rate_limited", () => {
  expect(mapAuthErrorCode({ code: "over_request_rate_limit" })).toBe("rate_limited");
  expect(mapAuthErrorCode({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
  expect(mapAuthErrorCode({ code: "over_sms_send_rate_limit" })).toBe("rate_limited");
});

it("returns unexpected for unknown codes", () => {
  expect(mapAuthErrorCode({ code: "some_new_supabase_code" })).toBe("unexpected");
  expect(mapAuthErrorCode({})).toBe("unexpected");
  expect(mapAuthErrorCode({ code: undefined })).toBe("unexpected");
});
```

## Vitest Configuration

**Config File:** `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});
```

**Key Configurations:**
- Path alias: `@` → `src/` (mirrors `tsconfig.json`)
- Environment: `node` (default), override with `@vitest-environment jsdom` in file
- Include pattern: `src/**/*.test.ts`, `src/**/*.test.tsx`
- Setup files: `src/test/setup.ts` (loads jest-dom matchers)

**Environment Override:**
- Use `/** @vitest-environment jsdom */` directive at top of React test files
- Enables DOM APIs and `@testing-library/react`

---

*Testing analysis: 2026-07-16*
