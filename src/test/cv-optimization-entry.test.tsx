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

  it("Optimize CV with AI button is disabled", () => {
    render(<DashboardActions />);
    const optimizeButton = screen.getByText("Optimize CV with AI").closest("button");
    expect(optimizeButton).toBeDisabled();
  });

  it("Optimize CV with AI button has Coming soon badge", () => {
    render(<DashboardActions />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("Optimize CV with AI button has accessible description", () => {
    render(<DashboardActions />);
    const optimizeButton = screen.getByText("Optimize CV with AI").closest("button");
    expect(optimizeButton).toHaveAttribute("aria-describedby", "optimize-cv-description");
  });

  it("accessible description contains coming soon message", () => {
    render(<DashboardActions />);
    const description = document.getElementById("optimize-cv-description");
    expect(description).toBeInTheDocument();
    expect(description?.textContent).toContain("Upload an existing CV and improve it with AI");
    expect(description?.textContent).toContain("Coming soon");
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

  it("Optimize CV with AI button is disabled", () => {
    render(<EmptyResumeState />);
    const optimizeButton = screen.getByText("Optimize CV with AI").closest("button");
    expect(optimizeButton).toBeDisabled();
  });

  it("Optimize CV with AI button has Coming soon badge", () => {
    render(<EmptyResumeState />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("Create Resume links to /resumes/new", () => {
    render(<EmptyResumeState />);
    const link = screen.getByText("Create Resume").closest("a");
    expect(link).toHaveAttribute("href", "/resumes/new");
  });
});
