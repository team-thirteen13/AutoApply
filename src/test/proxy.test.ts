import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── Mocks ───────────────────────────────────────────────────

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: vi.fn(() => new Response(null, { status: 200 })),
      redirect: vi.fn((url: URL) => {
        const res = new Response(null, {
          status: 307,
          headers: { Location: url.toString() },
        });
        return res;
      }),
    },
  };
});

// ── Import after mocks ─────────────────────────────────────

import { proxy, config } from "@/proxy";

// ── Helpers ─────────────────────────────────────────────────

function createRequest(pathname: string): NextRequest {
  const url = new URL("http://localhost:3000" + pathname);
  const nextUrl = Object.assign(url, {
    clone() {
      return new URL(url.toString()) as typeof nextUrl;
    },
  });
  return {
    nextUrl,
    cookies: {
      getAll: () => [],
      get: () => undefined,
    },
  } as unknown as NextRequest;
}

// ── Tests ───────────────────────────────────────────────────

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Public routes ────────────────────────────────────────

  describe("public routes", () => {
    it("allows / through", async () => {
      const response = await proxy(createRequest("/"));
      expect(response.status).toBe(200);
    });

    it("allows /login through", async () => {
      const response = await proxy(createRequest("/login"));
      expect(response.status).toBe(200);
    });

    it("allows /register through", async () => {
      const response = await proxy(createRequest("/register"));
      expect(response.status).toBe(200);
    });

    it("allows /auth/callback through", async () => {
      const response = await proxy(createRequest("/auth/callback"));
      expect(response.status).toBe(200);
    });
  });

  // ── Protected routes — unauthenticated ───────────────────

  describe("protected routes — unauthenticated", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it("redirects /dashboard to /login", async () => {
      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("redirects /resumes to /login", async () => {
      const response = await proxy(createRequest("/resumes"));
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("redirects /resumes/new to /login", async () => {
      const response = await proxy(createRequest("/resumes/new"));
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("redirects /resumes/[id]/edit to /login", async () => {
      const response = await proxy(
        createRequest("/resumes/abc-123/edit"),
      );
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("redirects /resumes/[id]/preview to /login", async () => {
      const response = await proxy(
        createRequest("/resumes/abc-123/preview"),
      );
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });
  });

  // ── Protected routes — authenticated ─────────────────────

  describe("protected routes — authenticated", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      });
    });

    it("allows /dashboard through", async () => {
      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(200);
    });

    it("allows /resumes through", async () => {
      const response = await proxy(createRequest("/resumes"));
      expect(response.status).toBe(200);
    });

    it("allows /resumes/[id]/edit through", async () => {
      const response = await proxy(
        createRequest("/resumes/abc-123/edit"),
      );
      expect(response.status).toBe(200);
    });

    it("allows /resumes/[id]/preview through", async () => {
      const response = await proxy(
        createRequest("/resumes/abc-123/preview"),
      );
      expect(response.status).toBe(200);
    });
  });

  // ── Return destination ───────────────────────────────────

  describe("return destination", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it("includes redirectTo in login URL for /dashboard", async () => {
      const response = await proxy(createRequest("/dashboard"));
      const location = response.headers.get("Location") ?? "";
      expect(location).toContain("redirectTo=%2Fdashboard");
    });

    it("includes redirectTo in login URL for nested resume route", async () => {
      const response = await proxy(
        createRequest("/resumes/abc-123/edit"),
      );
      const location = response.headers.get("Location") ?? "";
      expect(location).toContain("redirectTo=%2Fresumes%2Fabc-123%2Fedit");
    });
  });

  // ── Matcher config ───────────────────────────────────────

  describe("matcher config", () => {
    it("excludes API routes from proxy", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      // The negative lookahead should exclude api
      expect(matcher).toContain("api");
    });

    it("excludes _next static assets", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("_next");
    });
  });
});
