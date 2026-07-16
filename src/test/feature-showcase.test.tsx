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
