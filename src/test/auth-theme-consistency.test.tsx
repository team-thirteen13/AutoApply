/**
 * Tests for auth-theme-consistency: Login, Register, and Landing page
 * use the same light visual theme as the Dashboard.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock server-only and auth modules
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// ── Auth Shell ──────────────────────────────────────────────

describe("AuthShell", () => {
  it("renders heading and subheading", async () => {
    const { AuthShell } = await import("@/components/auth/auth-shell");
    render(
      <AuthShell heading="Welcome back" subheading="Sign in to continue.">
        <div>form content</div>
      </AuthShell>,
    );
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue.")).toBeInTheDocument();
  });

  it("renders logo with ApplyAI text", async () => {
    const { AuthShell } = await import("@/components/auth/auth-shell");
    render(
      <AuthShell heading="Test" subheading="Test sub">
        <div>content</div>
      </AuthShell>,
    );
    expect(screen.getAllByText("ApplyAI").length).toBeGreaterThan(0);
    const links = screen.getAllByLabelText("ApplyAI home");
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/");
  });

  it("uses light background gradient matching dashboard", async () => {
    const { AuthShell } = await import("@/components/auth/auth-shell");
    const { container } = render(
      <AuthShell heading="Test" subheading="Test sub">
        <div>content</div>
      </AuthShell>,
    );
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("from-slate-50");
    expect(outer.className).toContain("via-blue-50");
    expect(outer.className).toContain("to-violet-50");
  });

  it("renders white card with shadow and border", async () => {
    const { AuthShell } = await import("@/components/auth/auth-shell");
    const { container } = render(
      <AuthShell heading="Test" subheading="Test sub">
        <div>content</div>
      </AuthShell>,
    );
    const card = container.querySelector(".bg-white") as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toContain("shadow-lg");
    expect(card.className).toContain("border-slate-200");
    expect(card.className).toContain("rounded-2xl");
  });

  it("renders children inside the card", async () => {
    const { AuthShell } = await import("@/components/auth/auth-shell");
    render(
      <AuthShell heading="Test" subheading="Test sub">
        <button type="submit">Submit</button>
      </AuthShell>,
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});

// ── Login page source check ─────────────────────────────────

describe("LoginPage uses light theme", () => {
  it("does not use dark:bg-zinc-950 background", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/login/page.tsx"),
      "utf-8",
    );
    expect(content).not.toContain("dark:bg-zinc-950");
  });

  it("imports AuthShell", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/login/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("@/components/auth/auth-shell");
  });

  it("uses slate gradient background via AuthShell", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/components/auth/auth-shell.tsx"),
      "utf-8",
    );
    expect(content).toContain("from-slate-50");
    expect(content).toContain("via-blue-50");
    expect(content).toContain("to-violet-50");
  });

  it("renders welcome back heading text", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/login/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("Welcome back");
  });

  it("has gradient primary button", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/login/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("from-blue-600");
    expect(content).toContain("to-violet-600");
  });

  it("has register link", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/login/page.tsx"),
      "utf-8",
    );
    expect(content).toContain('href="/register"');
  });
});

// ── Register page source check ──────────────────────────────

describe("RegisterPage uses light theme", () => {
  it("does not use dark:bg-zinc-950 background", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).not.toContain("dark:bg-zinc-950");
  });

  it("imports AuthShell", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("@/components/auth/auth-shell");
  });

  it("renders create your account heading", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("Create your account");
  });

  it("has gradient primary button", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("from-blue-600");
    expect(content).toContain("to-violet-600");
  });

  it("has sign in link", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).toContain('href="/login"');
  });

  it("has all required form fields", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/register/page.tsx"),
      "utf-8",
    );
    expect(content).toContain('name="email"');
    expect(content).toContain('name="password"');
    expect(content).toContain('name="confirmPassword"');
  });
});

// ── Landing page source check ───────────────────────────────

describe("Landing page uses light theme", () => {
  it("does not use dark:bg-zinc-950 background", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/page.tsx"),
      "utf-8",
    );
    expect(content).not.toContain("dark:bg-zinc-950");
  });

  it("uses slate gradient background", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("from-slate-50");
    expect(content).toContain("via-blue-50");
    expect(content).toContain("to-violet-50");
  });

  it("renders ApplyAI branding", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/page.tsx"),
      "utf-8",
    );
    expect(content).toContain("ApplyAI");
  });

  it("has register and login links for unauthenticated users", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve("src/app/page.tsx"),
      "utf-8",
    );
    expect(content).toContain('href="/register"');
    expect(content).toContain('href="/login"');
  });
});
