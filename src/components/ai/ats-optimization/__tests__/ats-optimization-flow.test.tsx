// ─────────────────────────────────────────────────────────────
// ATS Optimization Flow Component Tests
// ─────────────────────────────────────────────────────────────
// Tests for the ATS optimization flow slide-over panel.
// Uses mocked server actions and focus trap.
// ─────────────────────────────────────────────────────────────

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AtsOptimizationFlow } from "../ats-optimization-flow";

// Mock HTMLDialogElement methods (not available in jsdom)
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();

// ── Mocks ────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

const mockCheckAvailability = vi.fn();
vi.mock("@/features/ats-optimization", () => ({
  optimizeResumeAction: vi.fn(),
  checkOptimizationAvailability: function (...args: unknown[]) {
    return mockCheckAvailability(...args);
  },
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

// ── Tests ────────────────────────────────────────────────────

describe("AtsOptimizationFlow", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAvailability.mockResolvedValue({ available: true });
  });

  it("renders dialog when open", async () => {
    const { container } = render(<AtsOptimizationFlow {...defaultProps} />);

    await waitFor(() => {
      expect(container.querySelector("[role='dialog']")).toBeInTheDocument();
    });
  });

  it("does not render dialog when closed", () => {
    const { container } = render(
      <AtsOptimizationFlow {...defaultProps} open={false} />,
    );

    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
  });

  it("has heading element", async () => {
    render(<AtsOptimizationFlow {...defaultProps} />);

    await waitFor(() => {
      const headings = screen.getAllByText("ATS Optimization");
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows unavailable state when not configured", async () => {
    mockCheckAvailability.mockResolvedValue({
      available: false,
      reason: "not_configured",
    });

    render(<AtsOptimizationFlow {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Optimization unavailable")).toBeInTheDocument();
    });
  });

  it("has close buttons", async () => {
    render(<AtsOptimizationFlow {...defaultProps} />);

    await waitFor(() => {
      const closeButtons = screen.getAllByLabelText("Close");
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("has backdrop element", async () => {
    render(<AtsOptimizationFlow {...defaultProps} />);

    await waitFor(() => {
      const backdrop = document.querySelector("[aria-hidden='true']");
      expect(backdrop).toBeInTheDocument();
    });
  });
});
