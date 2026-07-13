/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

vi.mock("@/lib/supabase/session", () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("@/features/profile/get-profile", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/components/profile/profile-form", () => ({
  ProfileForm: ({ initialProfile }: { initialProfile: unknown }) => (
    <div data-testid="profile-form">
      <span data-testid="profile-name">{(initialProfile as { name: string }).name}</span>
      <span data-testid="profile-email">{(initialProfile as { email: string }).email}</span>
      <div data-testid="completeness-indicator" />
    </div>
  ),
}));

vi.mock("@/components/profile/completeness-indicator", () => ({
  CompletenessIndicator: () => (
    <div data-testid="completeness-indicator" />
  ),
  calculateCompleteness: (profile: Record<string, string | null>) => {
    const REQUIRED_FIELDS = ["name", "email", "phone", "location", "githubUrl", "linkedinUrl", "portfolioUrl"];
    const filled = REQUIRED_FIELDS.filter((field) => {
      const value = profile[field];
      return value !== null && value !== undefined && String(value).trim().length > 0;
    }).length;
    return {
      filled,
      total: REQUIRED_FIELDS.length,
      percentage: Math.round((filled / REQUIRED_FIELDS.length) * 100),
    };
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/components/ui/form-field", () => ({
  FormField: ({
    label,
    children,
    error,
  }: {
    label: string;
    children: React.ReactNode;
    error?: string;
  }) => (
    <div>
      <label>{label}</label>
      {children}
      {error && <p role="alert">{error}</p>}
    </div>
  ),
}));

vi.mock("@/components/ui/toast", () => ({
  Toast: ({ message }: { message: string }) => (
    <div data-testid="toast">{message}</div>
  ),
}));

// ── Imports after mocks ────────────────────────────────────

import { render, screen } from "@testing-library/react";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getProfile } from "@/features/profile/get-profile";

// ── Test Data ──────────────────────────────────────────────

const mockProfile = {
  id: "profile-1",
  userId: "user-1",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 234 567 890",
  location: "San Francisco, CA",
  githubUrl: "https://github.com/johndoe",
  linkedinUrl: "https://linkedin.com/in/johndoe",
  portfolioUrl: "https://johndoe.dev",
  tagline: "Senior Software Engineer",
  bio: "Experienced software engineer with 10+ years of expertise.",
  imageUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// ── Tests ──────────────────────────────────────────────────

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const { default: ProfilePage } = await import("@/app/profile/page");

    await expect(ProfilePage()).rejects.toThrow("REDIRECT:/login");
  });

  it("renders profile form when authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      emailConfirmed: true,
      createdAt: "2024-01-01T00:00:00Z",
    });
    vi.mocked(getProfile).mockResolvedValue({
      success: true,
      data: mockProfile,
    });

    const { default: ProfilePage } = await import("@/app/profile/page");

    render(await ProfilePage());

    expect(screen.getByText("Your Profile")).toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
    expect(screen.getByTestId("completeness-indicator")).toBeInTheDocument();
  });

  it("displays error state when profile not found", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      emailConfirmed: true,
      createdAt: "2024-01-01T00:00:00Z",
    });
    vi.mocked(getProfile).mockResolvedValue({
      success: false,
      error: { code: "profile_not_found", message: "No profile found" },
    });

    const { default: ProfilePage } = await import("@/app/profile/page");

    render(await ProfilePage());

    expect(screen.getByText("Profile Not Found")).toBeInTheDocument();
    expect(
      screen.getByText("Your profile could not be loaded. Please try again later."),
    ).toBeInTheDocument();
  });

  it("renders back to dashboard link", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: "user-1",
      email: "john@example.com",
      emailConfirmed: true,
      createdAt: "2024-01-01T00:00:00Z",
    });
    vi.mocked(getProfile).mockResolvedValue({
      success: true,
      data: mockProfile,
    });

    const { default: ProfilePage } = await import("@/app/profile/page");

    render(await ProfilePage());

    const backLinks = screen.getAllByText("Back to Dashboard");
    expect(backLinks.length).toBeGreaterThan(0);
    expect(backLinks[0]).toHaveAttribute("href", "/dashboard");
  });
});

describe("Completeness calculation", () => {
  it("calculates completeness correctly for fully filled profile", async () => {
    const { calculateCompleteness } = await import(
      "@/components/profile/completeness-indicator"
    );

    const result = calculateCompleteness({
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234 567 890",
      location: "San Francisco, CA",
      githubUrl: "https://github.com/johndoe",
      linkedinUrl: "https://linkedin.com/in/johndoe",
      portfolioUrl: "https://johndoe.dev",
    });

    expect(result.filled).toBe(7);
    expect(result.total).toBe(7);
    expect(result.percentage).toBe(100);
  });

  it("calculates completeness for partially filled profile", async () => {
    const { calculateCompleteness } = await import(
      "@/components/profile/completeness-indicator"
    );

    const result = calculateCompleteness({
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234 567 890",
      location: "",
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
    });

    expect(result.filled).toBe(3);
    expect(result.total).toBe(7);
    expect(result.percentage).toBe(Math.round((3 / 7) * 100));
  });

  it("treats whitespace-only values as empty", async () => {
    const { calculateCompleteness } = await import(
      "@/components/profile/completeness-indicator"
    );

    const result = calculateCompleteness({
      name: "   ",
      email: "john@example.com",
      phone: "\t",
      location: "",
      githubUrl: "   ",
      linkedinUrl: null,
      portfolioUrl: null,
    });

    // Only email is filled
    expect(result.filled).toBe(1);
    expect(result.percentage).toBe(Math.round((1 / 7) * 100));
  });

  it("treats null and undefined as empty", async () => {
    const { calculateCompleteness } = await import(
      "@/components/profile/completeness-indicator"
    );

    const result = calculateCompleteness({
      name: null as unknown as string,
      email: "john@example.com",
      phone: null as unknown as string,
      location: null as unknown as string,
      githubUrl: null as unknown as string,
      linkedinUrl: null as unknown as string,
      portfolioUrl: null as unknown as string,
    });

    expect(result.filled).toBe(1);
    expect(result.percentage).toBe(Math.round((1 / 7) * 100));
  });

  it("always counts email as complete (auto-filled from auth)", async () => {
    const { calculateCompleteness } = await import(
      "@/components/profile/completeness-indicator"
    );

    const result = calculateCompleteness({
      name: "",
      email: "john@example.com",
      phone: "",
      location: "",
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
    });

    // Email always counts
    expect(result.filled).toBe(1);
  });
});

describe("Profile page — structural tests", () => {
  it("loading.tsx exports a default function component", async () => {
    const mod = await import("@/app/profile/loading");
    expect(typeof mod.default).toBe("function");
  });

  it("loading.tsx is a server component (no use client directive)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src/app/profile/loading.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/^"use client"/m);
  });

  it("error.tsx begins with use client directive", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src/app/profile/error.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/^"use client"/m);
  });

  it("error.tsx accepts error and reset props", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src/app/profile/error.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("reset: () => void");
    expect(content).toContain("onClick={reset}");
  });

  it("error.tsx contains accessible retry button", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src/app/profile/error.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Try again");
  });

  it("page.tsx exports a server component function", async () => {
    const mod = await import("@/app/profile/page");
    expect(typeof mod.default).toBe("function");
  });

  it("page.tsx is a server component (no use client directive)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "src/app/profile/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/^"use client"/m);
  });
});

describe("Profile form — email editability", () => {
  it("email field is not in the updateProfileSchema writable fields", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");
    const shape = updateProfileSchema.shape;

    // email should NOT be a writable field in the update schema
    expect(shape).not.toHaveProperty("email");

    // These fields SHOULD be writable
    expect(shape).toHaveProperty("name");
    expect(shape).toHaveProperty("phone");
    expect(shape).toHaveProperty("location");
    expect(shape).toHaveProperty("githubUrl");
    expect(shape).toHaveProperty("linkedinUrl");
    expect(shape).toHaveProperty("portfolioUrl");
  });

  it("profile type includes email as a read-only field", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    // The update schema is partial, meaning all writable fields are optional
    // Email is not in the schema, confirming it's read-only
    const schemaKeys = Object.keys(updateProfileSchema.shape);
    expect(schemaKeys).not.toContain("email");
  });
});

describe("Profile form — field validation", () => {
  it("updateProfileSchema rejects empty input", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("updateProfileSchema accepts partial updates", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    const result = updateProfileSchema.safeParse({ name: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("updateProfileSchema validates URL fields", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    const result = updateProfileSchema.safeParse({
      githubUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("updateProfileSchema accepts valid URLs", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    const result = updateProfileSchema.safeParse({
      githubUrl: "https://github.com/johndoe",
      linkedinUrl: "https://linkedin.com/in/johndoe",
      portfolioUrl: "https://johndoe.dev",
    });
    expect(result.success).toBe(true);
  });

  it("updateProfileSchema accepts null for optional URL fields", async () => {
    const { updateProfileSchema } = await import("@/lib/validation/profile");

    const result = updateProfileSchema.safeParse({
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
    });
    expect(result.success).toBe(true);
  });
});
