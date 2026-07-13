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

vi.mock("@/components/auth/google-oauth-button", () => ({
  GoogleOAuthButton: ({ nextPath }: { nextPath?: string }) => (
    <div data-testid="google-oauth-button" data-next-path={nextPath ?? "/dashboard"}>
      Continue with Google
    </div>
  ),
}));

vi.mock("@/app/login/actions", () => ({
  login: vi.fn(),
}));

vi.mock("@/app/register/actions", () => ({
  register: vi.fn(),
}));

// ── Import after mocks ─────────────────────────────────────

import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("Login page — Google OAuth integration", () => {
  it("renders the Google OAuth control", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("google-oauth-button")).toBeInTheDocument();
  });

  it("renders with default nextPath", () => {
    render(<LoginPage />);
    const button = screen.getByTestId("google-oauth-button");
    expect(button).toHaveAttribute("data-next-path", "/dashboard");
  });

  it("renders the email/password form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the Sign In submit button", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: "Sign In" }),
    ).toBeInTheDocument();
  });

  it("renders the visual divider", () => {
    const { container } = render(<LoginPage />);
    const divider = container.querySelector(".border-t");
    expect(divider).toBeInTheDocument();
  });

  it("renders the register link", () => {
    render(<LoginPage />);
    expect(screen.getByText("Register")).toHaveAttribute("href", "/register");
  });

  it("renders the page heading", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();
  });
});

describe("Register page — Google OAuth integration", () => {
  it("renders the Google OAuth control", () => {
    render(<RegisterPage />);
    expect(screen.getByTestId("google-oauth-button")).toBeInTheDocument();
  });

  it("renders with default nextPath", () => {
    render(<RegisterPage />);
    const button = screen.getByTestId("google-oauth-button");
    expect(button).toHaveAttribute("data-next-path", "/dashboard");
  });

  it("renders the email/password form", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("renders the Register submit button", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("button", { name: "Register" }),
    ).toBeInTheDocument();
  });

  it("renders the visual divider", () => {
    const { container } = render(<RegisterPage />);
    const divider = container.querySelector(".border-t");
    expect(divider).toBeInTheDocument();
  });

  it("renders the sign-in link", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Sign in")).toHaveAttribute("href", "/login");
  });

  it("renders the page heading", () => {
    render(<RegisterPage />);
    expect(
      screen.getByRole("heading", { name: "Create Account" }),
    ).toBeInTheDocument();
  });
});
