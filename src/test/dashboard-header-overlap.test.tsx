/**
 * @vitest-environment jsdom
 *
 * Regression tests for GitHub issue #130:
 * Sticky dashboard header intercepting Optimize CV clicks.
 *
 * Verifies:
 * 1. Optimize buttons render with type="button"
 * 2. Header background is fully opaque (prevents misleading overlap)
 * 3. Logout button remains inside its form
 * 4. Optimize buttons are not inside any form
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("@/components/ai/ats-optimization", () => ({
  AtsOptimizationFlow: () => null,
}));

vi.mock("@/features/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/supabase/session", () => ({
  getAuthenticatedSession: vi.fn(),
  getSessionUser: vi.fn(),
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("lucide-react", () => ({
  Sparkles: () => <span data-testid="sparkles-icon" />,
  Wand2: () => <span data-testid="wand2-icon" />,
  FilePlus2: () => <span data-testid="file-plus-icon" />,
  LogOut: () => <span data-testid="logout-icon" />,
  LayoutDashboard: () => <span data-testid="dashboard-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: () => [null, vi.fn(), false],
  };
});

vi.mock("@/app/dashboard/actions", () => ({
  logout: vi.fn(),
}));

// ── Import after mocks ─────────────────────────────────────

import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { EmptyResumeState } from "@/components/dashboard/empty-state";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("Dashboard header overlap regression (issue #130)", () => {
  describe("Optimize button type attribute", () => {
    it("DashboardActions Optimize button has type='button'", () => {
      render(<DashboardActions />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("EmptyResumeState Optimize button has type='button'", () => {
      render(<EmptyResumeState />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("DashboardActions Optimize button is not type='submit'", () => {
      render(<DashboardActions />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button?.getAttribute("type")).not.toBe("submit");
    });

    it("EmptyResumeState Optimize button is not type='submit'", () => {
      render(<EmptyResumeState />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button?.getAttribute("type")).not.toBe("submit");
    });
  });

  describe("Optimize button is not inside a form", () => {
    it("DashboardActions Optimize button has no form ancestor", () => {
      render(<DashboardActions />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button?.closest("form")).toBeNull();
    });

    it("EmptyResumeState Optimize button has no form ancestor", () => {
      render(<EmptyResumeState />);
      const button = screen.getByText("Optimize CV with AI").closest("button");
      expect(button?.closest("form")).toBeNull();
    });
  });

  describe("Header background opacity", () => {
    it("header has fully opaque background (bg-white, not bg-white/80)", () => {
      render(<DashboardHeader email="test@example.com" />);
      const header = screen.getByRole("banner");
      expect(header.className).toContain("bg-white");
      // Must NOT have the semi-transparent variant
      expect(header.className).not.toMatch(/bg-white\/\d+/);
    });

    it("header has sticky positioning", () => {
      render(<DashboardHeader email="test@example.com" />);
      const header = screen.getByRole("banner");
      expect(header.className).toContain("sticky");
      expect(header.className).toContain("top-0");
    });

    it("header has z-40 for proper stacking", () => {
      render(<DashboardHeader email="test@example.com" />);
      const header = screen.getByRole("banner");
      expect(header.className).toContain("z-40");
    });
  });

  describe("Logout button remains in its form", () => {
    it("Logout button is inside a form element", () => {
      render(<DashboardHeader email="test@example.com" />);
      const logoutButton = screen.getByRole("button", { name: /sign out/i });
      expect(logoutButton.closest("form")).not.toBeNull();
    });

    it("Logout button has type='submit'", () => {
      render(<DashboardHeader email="test@example.com" />);
      const logoutButton = screen.getByRole("button", { name: /sign out/i });
      expect(logoutButton).toHaveAttribute("type", "submit");
    });
  });
});
