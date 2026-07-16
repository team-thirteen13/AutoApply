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

import { TestimonialCard } from "@/components/landing/testimonial-card";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TestimonialCard", () => {
  const defaultProps = {
    name: "Sarah Chen",
    title: "Software Engineer",
    company: "Google",
    quote: "AutoApply helped me craft a resume that actually got noticed.",
  };

  it("renders name, title, company, and quote", () => {
    render(<TestimonialCard {...defaultProps} />);
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer at Google")).toBeInTheDocument();
    expect(
      screen.getByText(/AutoApply helped me craft a resume/)
    ).toBeInTheDocument();
  });

  it("displays initials in avatar circle", () => {
    render(<TestimonialCard {...defaultProps} />);
    expect(screen.getByText("SC")).toBeInTheDocument();
  });

  it("quote contains quotation marks", () => {
    render(<TestimonialCard {...defaultProps} />);
    const quote = screen.getByText(/AutoApply helped me craft/);
    expect(quote.textContent).toContain("“");
    expect(quote.textContent).toContain("”");
  });

  it("applies circle avatar with bg-hero-start and white text", () => {
    const { container } = render(<TestimonialCard {...defaultProps} />);
    const avatar = container.querySelector(".rounded-full");
    expect(avatar).toBeInTheDocument();
    expect(avatar?.className).toContain("bg-hero-start");
    expect(avatar?.className).toContain("text-white");
  });

  it("applies card container classes", () => {
    const { container } = render(<TestimonialCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("p-6");
    expect(card.className).toContain("shadow-sm");
  });
});
