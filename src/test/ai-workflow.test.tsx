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
import { Search } from "lucide-react";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkflowStep", () => {
  const defaultProps = {
    number: 1,
    icon: Search,
    label: "Resume Analysis",
  };

  it("renders the step number and label", () => {
    render(<WorkflowStep {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Resume Analysis")).toBeInTheDocument();
  });

  it("applies numbered circle with bg-accent and white text", () => {
    const { container } = render(<WorkflowStep {...defaultProps} />);
    const circle = container.querySelector(".rounded-full");
    expect(circle).toBeInTheDocument();
    expect(circle?.className).toContain("bg-accent");
    expect(circle?.className).toContain("text-white");
  });

  it("renders the icon below the numbered circle", () => {
    render(<WorkflowStep {...defaultProps} />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("applies correct layout classes", () => {
    const { container } = render(<WorkflowStep {...defaultProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("flex-col");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("text-center");
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
    expect(section?.className).toContain("bg-white");
  });
});
