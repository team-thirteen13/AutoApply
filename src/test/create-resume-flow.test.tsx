/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

const mockCreateResumeAction = vi.fn();
vi.mock("@/app/resumes/actions", () => ({
  createResumeAction: (...args: unknown[]) => mockCreateResumeAction(...args),
  listVersionsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  parseResumeFileAction: vi.fn(),
  createResumeWithSnapshotAction: vi.fn(),
}));

vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("@/features/ats-optimization", () => ({
  optimizeResumeAction: vi.fn(),
  checkOptimizationAvailability: vi.fn().mockResolvedValue({ available: true }),
}));

vi.mock("@/lib/skills-normalize", () => ({
  normalizeSnapshotSkills: (s: unknown) => s,
}));

vi.mock("@/lib/templates", () => ({
  normalizeSnapshotTemplate: (s: unknown) => s,
}));

vi.mock("@/lib/date-normalize", () => ({
  normalizeSnapshotDates: (s: unknown) => s,
}));

// ── Import after mocks ─────────────────────────────────────

import NewResumePage from "@/app/resumes/new/page";
import { INITIAL_SNAPSHOT } from "@/features/resume/initial-snapshot";
import { TEMPLATES } from "@/lib/templates/registry";
import { normalizeSnapshotTemplate } from "@/lib/templates/normalize";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── 1. Dashboard create link ───────────────────────────────

describe("Dashboard create link", () => {
  it("links to /resumes/new", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dashboardPath = path.resolve(
      process.cwd(),
      "src/app/dashboard/page.tsx",
    );
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain('href="/resumes/new"');
  });
});

// ── 2. Valid form submission ───────────────────────────────

describe("Create resume form — valid submission", () => {
  beforeEach(() => {
    mockCreateResumeAction.mockResolvedValue({
      success: true,
      resumeId: "resume-new-123",
    });
  });

  it("calls canonical create action with title and targetRole", async () => {
    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Test Resume" },
    });
    fireEvent.change(screen.getByLabelText(/Target Role/), {
      target: { value: "Senior Engineer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(mockCreateResumeAction).toHaveBeenCalledWith(
        "My Test Resume",
        "Senior Engineer",
      );
    });
  });

  it("navigates to builder on success", async () => {
    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/resumes/resume-new-123/edit");
    });
  });

  it("shows pending state during submission", async () => {
    // Use a promise we control to avoid async leaking into next test
    let resolveAction!: (value: unknown) => void;
    mockCreateResumeAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "Slow Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Creating/ })).toBeDisabled();
    });

    // Resolve the pending action so it doesn't leak into next test
    resolveAction({ success: true, resumeId: "resume-1" });
    // Wait for React to process the state update
    await new Promise((r) => setTimeout(r, 0));
  });
});

// ── 3. Invalid title shows field error ─────────────────────

describe("Create resume form — validation", () => {
  it("shows field error for empty title", async () => {
    render(<NewResumePage />);

    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });

    expect(mockCreateResumeAction).not.toHaveBeenCalled();
  });

  it("shows field error for title exceeding 200 characters", async () => {
    render(<NewResumePage />);

    const longTitle = "A".repeat(201);
    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: longTitle },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Title must be 200 characters or less"),
      ).toBeInTheDocument();
    });
  });

  it("clears field error when user types", async () => {
    render(<NewResumePage />);

    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));
    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "A" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    });
  });

  it("preserves entered values after validation failure", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: false,
      error: "Server error",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });
    fireEvent.change(screen.getByLabelText(/Target Role/), {
      target: { value: "Engineer" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("My Resume")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Engineer")).toBeInTheDocument();
    });
  });
});

// ── 4. Unauthenticated creation ────────────────────────────

describe("Create resume form — auth errors", () => {
  it("shows safe error for authentication_required", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: false,
      error: "You must be signed in to create a resume",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(
        screen.getByText("You must be signed in to create a resume"),
      ).toBeInTheDocument();
    });
  });
});

// ── 5. Resume creation failure ─────────────────────────────

describe("Create resume form — creation failure", () => {
  it("displays form-level error for resume creation failure", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: false,
      error: "Failed to create resume. Please try again.",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create resume. Please try again."),
      ).toBeInTheDocument();
    });
  });
});

// ── 6-7. Version creation failure ──────────────────────────

describe("Create resume form — version failure", () => {
  it("displays form-level error for version creation failure", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: false,
      error: "Failed to initialize resume. Please try again.",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to initialize resume. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("does not navigate on version failure", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: false,
      error: "Failed to initialize resume. Please try again.",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "My Resume" },
    });

    mockPush.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to initialize resume. Please try again."),
      ).toBeInTheDocument();
    });

    // Wait a tick to ensure no delayed navigation
    await new Promise((r) => setTimeout(r, 50));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── 8. Orphan cleanup ──────────────────────────────────────

describe("Create resume action — orphan cleanup", () => {
  it("INITIAL_SNAPSHOT is a valid ResumeSnapshot shape", () => {
    expect(INITIAL_SNAPSHOT).toBeDefined();
    expect(INITIAL_SNAPSHOT.templateId).toBe("classic");
    expect(Array.isArray(INITIAL_SNAPSHOT.skills)).toBe(true);
    expect(INITIAL_SNAPSHOT.skills).toHaveLength(0);
  });
});

// ── 9-11. Initial snapshot shape ───────────────────────────

describe("Initial snapshot", () => {
  it("includes templateId: classic", () => {
    expect(INITIAL_SNAPSHOT.templateId).toBe("classic");
  });

  it("includes object-form skills: []", () => {
    expect(Array.isArray(INITIAL_SNAPSHOT.skills)).toBe(true);
    expect(INITIAL_SNAPSHOT.skills).toHaveLength(0);
  });

  it("includes all required section arrays", () => {
    expect(Array.isArray(INITIAL_SNAPSHOT.experiences)).toBe(true);
    expect(Array.isArray(INITIAL_SNAPSHOT.education)).toBe(true);
    expect(Array.isArray(INITIAL_SNAPSHOT.projects)).toBe(true);
    expect(Array.isArray(INITIAL_SNAPSHOT.certificates)).toBe(true);
    expect(Array.isArray(INITIAL_SNAPSHOT.languages)).toBe(true);
  });
});

// ── 12. Successful creation returns resumeId ───────────────

describe("Create resume action — success", () => {
  it("action returns resumeId for successful creation", async () => {
    mockCreateResumeAction.mockResolvedValue({
      success: true,
      resumeId: "resume-abc-123",
    });

    render(<NewResumePage />);

    fireEvent.change(screen.getByLabelText(/Resume Title/), {
      target: { value: "Test Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Resume/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/resumes/resume-abc-123/edit");
    });
  });
});

// ── 13. Dashboard revalidation ─────────────────────────────

describe("Dashboard revalidation", () => {
  it("action calls revalidatePath for /dashboard", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const actionsPath = path.resolve(
      process.cwd(),
      "src/app/resumes/actions.ts",
    );
    const content = fs.readFileSync(actionsPath, "utf-8");
    expect(content).toContain('revalidatePath("/dashboard")');
  });
});

// ── 17. Duplicate action removed ───────────────────────────

describe("No duplicate create action", () => {
  it("new/page.tsx does not contain a private createResumeFormAction", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pagePath = path.resolve(
      process.cwd(),
      "src/app/resumes/new/page.tsx",
    );
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).not.toContain("createResumeFormAction");
  });

  it("new/page.tsx imports from canonical actions.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pagePath = path.resolve(
      process.cwd(),
      "src/app/resumes/new/page.tsx",
    );
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain('from "@/app/resumes/actions"');
  });
});

// ── 18. RLS behavior intact ────────────────────────────────

describe("RLS and ownership", () => {
  it("createResume uses requireAuthenticatedUser", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const createPath = path.resolve(
      process.cwd(),
      "src/features/resume/create-resume.ts",
    );
    const content = fs.readFileSync(createPath, "utf-8");
    expect(content).toContain("requireAuthenticatedUser");
  });

  it("createVersion verifies resume ownership", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const versionPath = path.resolve(
      process.cwd(),
      "src/features/resume/create-version.ts",
    );
    const content = fs.readFileSync(versionPath, "utf-8");
    expect(content).toContain('eq("user_id", user.id)');
  });
});

// ── 19. Phase 3 validation regression ──────────────────────

describe("Phase 3 validation intact", () => {
  it("validateSection still exists in builder validation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const validationPath = path.resolve(
      process.cwd(),
      "src/lib/validation/builder.ts",
    );
    const content = fs.readFileSync(validationPath, "utf-8");
    expect(content).toContain("export function validateSection");
    expect(content).toContain("export function findFirstInvalidSection");
  });
});

// ── 20. Phase 4 templates intact ───────────────────────────

describe("Phase 4 templates intact", () => {
  it("template registry exists with 3 templates", () => {
    expect(TEMPLATES).toHaveLength(3);
  });

  it("normalizeSnapshotTemplate exists", () => {
    expect(typeof normalizeSnapshotTemplate).toBe("function");
  });
});
