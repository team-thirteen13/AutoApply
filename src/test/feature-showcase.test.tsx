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
  FileText: () => <span data-testid="file-text-icon" />,
  User: () => <span data-testid="user-icon" />,
  Briefcase: () => <span data-testid="briefcase-icon" />,
  GraduationCap: () => <span data-testid="graduation-cap-icon" />,
  FolderOpen: () => <span data-testid="folder-open-icon" />,
  Wrench: () => <span data-testid="wrench-icon" />,
}));

// ── Import after mocks ─────────────────────────────────────

import { FeatureCard } from "@/components/landing/feature-card";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { FileText } from "lucide-react";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FeatureCard", () => {
  const defaultProps = {
    icon: FileText,
    title: "Resume Creation",
    description: "Build professional resumes with AI-powered suggestions.",
  };

  it("renders title and description text", () => {
    render(<FeatureCard {...defaultProps} />);
    expect(screen.getByText("Resume Creation")).toBeInTheDocument();
    expect(
      screen.getByText("Build professional resumes with AI-powered suggestions.")
    ).toBeInTheDocument();
  });

  it("applies card container classes", () => {
    const { container } = render(<FeatureCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("p-6");
    expect(card.className).toContain("shadow-sm");
  });

  it("applies hover effect classes", () => {
    const { container } = render(<FeatureCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("motion-safe:hover:shadow-md");
    expect(card.className).toContain("motion-safe:hover:-translate-y-1");
  });

  it("renders icon in container with bg-hero-start/10 background", () => {
    const { container } = render(<FeatureCard {...defaultProps} />);
    // Find the icon container (the div with the icon inside)
    const iconContainer = container.querySelector(".bg-hero-start\\/10");
    expect(iconContainer).toBeInTheDocument();
  });
});

describe("FeatureShowcase", () => {
  it("renders all 6 feature cards", () => {
    render(<FeatureShowcase />);
    expect(screen.getByText("Resume Creation")).toBeInTheDocument();
    expect(screen.getByText("Profile Management")).toBeInTheDocument();
    expect(screen.getByText("Experience Tracking")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Project Listings")).toBeInTheDocument();
    expect(screen.getByText("Skill Management")).toBeInTheDocument();
  });

  it("renders section heading and subtitle", () => {
    render(<FeatureShowcase />);
    expect(
      screen.getByText("Everything you need to build the perfect resume")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "AutoApply gives you the tools to create, manage, and optimize your professional resume."
      )
    ).toBeInTheDocument();
  });

  it("section has correct grid layout classes", () => {
    const { container } = render(<FeatureShowcase />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
  });

  it("section has gradient background", () => {
    const { container } = render(<FeatureShowcase />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("bg-gradient-to-b");
    expect(section?.className).toContain("from-white");
    expect(section?.className).toContain("to-slate-50");
  });
});
