/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

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
  Sparkles: () => <span data-testid="sparkles-icon" />,
  Wand2: () => <span data-testid="wand2-icon" />,
  FilePlus2: () => <span data-testid="file-plus-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Check: () => <span data-testid="check-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  ChevronLeft: () => <span data-testid="chevron-left-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
  RotateCcw: () => <span data-testid="rotate-icon" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock("@/features/ats-optimization", () => ({
  optimizeResumeAction: vi.fn(),
  checkOptimizationAvailability: vi.fn().mockResolvedValue({ available: true }),
}));

vi.mock("@/app/resumes/actions", () => ({
  parseResumeFileAction: vi.fn(),
  createResumeWithSnapshotAction: vi.fn(),
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

import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { EmptyResumeState } from "@/components/dashboard/empty-state";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("Dashboard Actions", () => {
  it("renders Create New Resume button", () => {
    render(<DashboardActions />);
    expect(screen.getByText("Create New Resume")).toBeInTheDocument();
  });

  it("renders Optimize CV with AI button", () => {
    render(<DashboardActions />);
    expect(screen.getByText("Optimize CV with AI")).toBeInTheDocument();
  });

  it("does not render Generate with AI button", () => {
    render(<DashboardActions />);
    expect(screen.queryByText("Generate with AI")).not.toBeInTheDocument();
  });

  it("Optimize CV with AI button is enabled", () => {
    render(<DashboardActions />);
    const optimizeButton = screen.getByText("Optimize CV with AI").closest("button");
    expect(optimizeButton).not.toBeDisabled();
  });

  it("Create New Resume links to /resumes/new", () => {
    render(<DashboardActions />);
    const link = screen.getByText("Create New Resume").closest("a");
    expect(link).toHaveAttribute("href", "/resumes/new");
  });
});

describe("Empty Resume State", () => {
  it("renders Create Resume button", () => {
    render(<EmptyResumeState />);
    expect(screen.getByText("Create Resume")).toBeInTheDocument();
  });

  it("renders Optimize CV with AI button", () => {
    render(<EmptyResumeState />);
    expect(screen.getByText("Optimize CV with AI")).toBeInTheDocument();
  });

  it("does not render Generate with AI button", () => {
    render(<EmptyResumeState />);
    expect(screen.queryByText("Generate with AI")).not.toBeInTheDocument();
  });

  it("Optimize CV with AI button is enabled", () => {
    render(<EmptyResumeState />);
    const optimizeButton = screen.getByText("Optimize CV with AI").closest("button");
    expect(optimizeButton).not.toBeDisabled();
  });

  it("Create Resume links to /resumes/new", () => {
    render(<EmptyResumeState />);
    const link = screen.getByText("Create Resume").closest("a");
    expect(link).toHaveAttribute("href", "/resumes/new");
  });
});
