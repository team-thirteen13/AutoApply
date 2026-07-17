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

import { Footer } from "@/components/landing/footer";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Footer", () => {
  it("renders all 4 column headings", () => {
    render(<Footer />);
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders all 8 link items with correct labels", () => {
    render(<Footer />);
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Help Center")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("all links have correct href attributes", () => {
    render(<Footer />);
    expect(screen.getByText("Features")).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("Pricing")).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("Blog")).toHaveAttribute("href", "/blog");
    expect(screen.getByText("Help Center")).toHaveAttribute("href", "/help");
    expect(screen.getByText("About")).toHaveAttribute("href", "/about");
    expect(screen.getByText("Contact")).toHaveAttribute("href", "/contact");
    expect(screen.getByText("Privacy Policy")).toHaveAttribute("href", "/privacy");
    expect(screen.getByText("Terms of Service")).toHaveAttribute("href", "/terms");
  });

  it("has role='contentinfo' attribute", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("copyright text contains current year", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const copyrightText = screen.getByText(
      new RegExp(`© ${currentYear} AutoApply\\. All rights reserved\\.`)
    );
    expect(copyrightText).toBeInTheDocument();
  });

  it("copyright text contains 'AutoApply'", () => {
    render(<Footer />);
    const copyrightText = screen.getByText(/AutoApply/);
    expect(copyrightText).toBeInTheDocument();
  });

  it("bottom section renders Privacy and Terms repeated links", () => {
    render(<Footer />);
    const privacyLinks = screen.getAllByText(/Privacy/);
    const termsLinks = screen.getAllByText(/Terms/);
    // Each should appear at least twice (column + bottom section)
    expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
    expect(termsLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("footer element has bg-gray-900 class", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.className).toContain("bg-gray-900");
  });

  it("does not render a gradient transition div", () => {
    const { container } = render(<Footer />);
    const gradientDiv = container.querySelector(
      ".bg-gradient-to-b.from-transparent.to-gray-900"
    );
    expect(gradientDiv).not.toBeInTheDocument();
  });

  it("grid uses responsive classes", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.innerHTML).toContain("grid-cols-2");
    expect(footer.innerHTML).toContain("md:grid-cols-4");
  });
});
