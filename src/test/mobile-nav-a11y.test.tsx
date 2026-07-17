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
  Menu: () => <span data-testid="menu-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: () => ({ current: null }),
}));

// ── Import after mocks ─────────────────────────────────────

import { Navbar } from "@/components/landing/navbar";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MobileNav accessibility", () => {
  it("hamburger button has aria-expanded attribute", () => {
    render(<Navbar user={null} />);
    const hamburger = screen.getByRole("button", { name: /open navigation menu/i });
    expect(hamburger).toHaveAttribute("aria-expanded");
  });

  it("hamburger button has aria-controls pointing to mobile-navigation", () => {
    render(<Navbar user={null} />);
    const hamburger = screen.getByRole("button", { name: /open navigation menu/i });
    expect(hamburger).toHaveAttribute("aria-controls", "mobile-navigation");
  });

  it("mobile nav panel has role='dialog'", () => {
    const { container } = render(<Navbar user={null} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });

  it("mobile nav panel has aria-modal='true'", () => {
    const { container } = render(<Navbar user={null} />);
    const dialog = container.querySelector('[aria-modal="true"]');
    expect(dialog).toBeInTheDocument();
  });

  it("mobile nav panel has aria-label='Navigation menu'", () => {
    const { container } = render(<Navbar user={null} />);
    const dialog = container.querySelector('[aria-label="Navigation menu"]');
    expect(dialog).toBeInTheDocument();
  });

  it("mobile nav panel has id='mobile-navigation'", () => {
    const { container } = render(<Navbar user={null} />);
    const dialog = container.querySelector("#mobile-navigation");
    expect(dialog).toBeInTheDocument();
  });
});
