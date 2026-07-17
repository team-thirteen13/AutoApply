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
  User: () => <span data-testid="user-icon" />,
}));

// ── Import after mocks ─────────────────────────────────────

import { TestimonialCard } from "@/components/landing/testimonial-card";
import { Testimonials } from "@/components/landing/testimonials";

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

  it("displays photo placeholder avatar", () => {
    const { container } = render(<TestimonialCard {...defaultProps} />);
    const avatar = container.querySelector(".rounded-full");
    expect(avatar).toBeInTheDocument();
    expect(avatar?.className).toContain("bg-white/10");
  });

  it("quote is bold and has no quotation marks", () => {
    render(<TestimonialCard {...defaultProps} />);
    const quote = screen.getByText(/AutoApply helped me craft/);
    expect(quote.className).toContain("font-semibold");
    expect(quote.className).toContain("text-white");
    expect(quote.textContent).not.toContain("“");
    expect(quote.textContent).not.toContain("”");
  });

  it("attribution has lighter styling", () => {
    render(<TestimonialCard {...defaultProps} />);
    const nameEl = screen.getByText("Sarah Chen");
    expect(nameEl.className).toContain("font-medium");
    expect(nameEl.className).toContain("text-white/80");
  });

  it("applies gradient card classes", () => {
    const { container } = render(<TestimonialCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-2xl");
    expect(card.className).toContain("bg-gradient-to-br");
    expect(card.className).toContain("p-6");
  });
});

describe("Testimonials", () => {
  it("renders all 6 testimonial cards", () => {
    render(<Testimonials />);
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("Marcus Johnson")).toBeInTheDocument();
    expect(screen.getByText("Priya Patel")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Jamie Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Taylor Kim")).toBeInTheDocument();
  });

  it("renders section heading text", () => {
    render(<Testimonials />);
    expect(screen.getByText("Loved by job seekers")).toBeInTheDocument();
  });

  it("has testimonials-start background", () => {
    const { container } = render(<Testimonials />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("bg-testimonials-start");
  });

  it("uses carousel layout", () => {
    const { container } = render(<Testimonials />);
    const carousel = container.querySelector(".overflow-x-auto");
    expect(carousel).toBeInTheDocument();
    expect(carousel?.className).toContain("snap-x");
    expect(carousel?.className).toContain("snap-mandatory");
    const cardWrapper = carousel?.querySelector(".snap-center");
    expect(cardWrapper).toBeInTheDocument();
    expect(cardWrapper?.className).toContain("shrink-0");
  });
});
