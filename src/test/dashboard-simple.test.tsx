/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

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
  AlertTriangle: () => <span data-testid="alert-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
}));

// ── Import after mocks ─────────────────────────────────────

import DashboardError from "@/app/dashboard/error";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("DashboardError", () => {
  it("renders error message", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    
    render(<DashboardError error={error} reset={reset} />);
    
    expect(screen.getByText("Unable to load dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    
    render(<DashboardError error={error} reset={reset} />);
    
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("calls reset when retry clicked", () => {
    const error = new Error("Test error");
    const reset = vi.fn();
    
    render(<DashboardError error={error} reset={reset} />);
    
    screen.getByText("Try Again").click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
