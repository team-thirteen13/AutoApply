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

// ── Import after mocks ─────────────────────────────────────

import { SkipToContent } from "@/components/landing/skip-to-content";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SkipToContent", () => {
  it("renders an anchor with href to main-content", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("contains the text 'Skip to main content'", () => {
    render(<SkipToContent />);
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });

  it("has sr-only class for screen readers", () => {
    const { container } = render(<SkipToContent />);
    const link = container.querySelector("a");
    expect(link?.className).toContain("sr-only");
  });

  it("becomes visible on focus with fixed positioning", () => {
    const { container } = render(<SkipToContent />);
    const link = container.querySelector("a");
    expect(link?.className).toContain("focus:not-sr-only");
    expect(link?.className).toContain("focus:fixed");
    expect(link?.className).toContain("focus:top-4");
    expect(link?.className).toContain("focus:left-4");
    expect(link?.className).toContain("focus:z-[60]");
  });
});
