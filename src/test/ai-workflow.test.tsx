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
  Search: () => <span data-testid="search-icon" />,
  Target: () => <span data-testid="target-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  BarChart3: () => <span data-testid="bar-chart-icon" />,
}));

// ── Import after mocks ─────────────────────────────────────

import { WorkflowStep } from "@/components/landing/workflow-step";
import { CTASection } from "@/components/landing/cta-section";
import { AIWorkflow } from "@/components/landing/ai-workflow";
import { Search } from "lucide-react";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkflowStep", () => {
  const defaultProps = {
    icon: Search,
    number: "01",
    label: "Resume Analysis",
    description: "AI scans your resume for strengths and gaps.",
  };

  it("renders the number, label, and description", () => {
    render(<WorkflowStep {...defaultProps} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Resume Analysis")).toBeInTheDocument();
    expect(screen.getByText("AI scans your resume for strengths and gaps.")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<WorkflowStep {...defaultProps} />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("applies dark gradient card classes", () => {
    const { container } = render(<WorkflowStep {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-2xl");
    expect(card.className).toContain("bg-gradient-to-br");
    expect(card.className).toContain("p-6");
  });

  it("renders without description when not provided", () => {
    const { container } = render(
      <WorkflowStep icon={Search} number="01" label="Test" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.textContent).toContain("Test");
  });
});

describe("CTASection", () => {
  const defaultProps = {
    headline: "Ready to build your resume?",
    subtext: "Join thousands of job seekers who trust AutoApply.",
  };

  it("renders headline and subtext", () => {
    render(<CTASection {...defaultProps} />);
    expect(screen.getByText("Ready to build your resume?")).toBeInTheDocument();
    expect(
      screen.getByText("Join thousands of job seekers who trust AutoApply.")
    ).toBeInTheDocument();
  });

  it("renders a sign-up button linking to /register", () => {
    render(<CTASection {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/register");
    expect(link.textContent).toContain("Sign Up for Free");
  });

  it("applies gradient background classes", () => {
    const { container } = render(<CTASection {...defaultProps} />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("py-16");
    expect(section?.className).toContain("bg-gradient-to-br");
  });
});

describe("AIWorkflow", () => {
  it("renders all 4 workflow cards", () => {
    render(<AIWorkflow />);
    expect(screen.getByText("Resume Analysis")).toBeInTheDocument();
    expect(screen.getByText("Job Matching")).toBeInTheDocument();
    expect(screen.getByText("Cover Letters")).toBeInTheDocument();
    expect(screen.getByText("ATS Score")).toBeInTheDocument();
  });

  it("renders numbered steps", () => {
    render(<AIWorkflow />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });

  it("has correct section heading text", () => {
    render(<AIWorkflow />);
    expect(
      screen.getByText("Your AI-powered job search")
    ).toBeInTheDocument();
  });

  it("has dark ai-start background", () => {
    const { container } = render(<AIWorkflow />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("bg-ai-start");
  });

  it("uses 4-column grid layout", () => {
    const { container } = render(<AIWorkflow />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("lg:grid-cols-4");
  });
});
