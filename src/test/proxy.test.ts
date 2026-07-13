import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── Mock cookie store ───────────────────────────────────────
// Simulates the Next.js ResponseCookies API for testing.

interface MockCookie {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  sameSite?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

function createMockCookies() {
  const store = new Map<string, MockCookie>();

  return {
    getAll: () => Array.from(store.values()),
    set(
      cookie: MockCookie | string,
      value?: string,
      options?: Record<string, unknown>,
    ) {
      if (typeof cookie === "string") {
        // Called as set(name, value, options) — merge options into cookie
        store.set(cookie, { name: cookie, value: value ?? "", ...options });
      } else {
        store.set(cookie.name, cookie);
      }
    },
    has: (name: string) => store.has(name),
    get: (name: string) => store.get(name),
  };
}

type MockCookies = ReturnType<typeof createMockCookies>;

// ── Mocks ───────────────────────────────────────────────────

const mockGetUser = vi.fn();
let capturedSetAll: ((cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>, headers: Record<string, string>) => void) | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url: string, _key: string, opts: unknown) => {
    const config = opts as {
      cookies: {
        getAll: () => unknown[];
        setAll: (cookies: MockCookie[]) => void;
      };
    };
    capturedSetAll = config.cookies.setAll;
    return {
      auth: {
        getUser: mockGetUser,
      },
    };
  }),
}));

vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: vi.fn(() => {
        const cookies = createMockCookies();
        const res = new Response(null, { status: 200 });
        // Attach cookies to the Response-like object for proxy to use.
        // The proxy accesses response.cookies.getAll() and .set().
        return Object.assign(res, { cookies });
      }),
      redirect: vi.fn((url: URL) => {
        const cookies = createMockCookies();
        const res = new Response(null, {
          status: 307,
          headers: { Location: url.toString() },
        });
        // Only assign cookies — headers is a getter on Response
        // and cannot be overwritten via Object.assign.
        return Object.assign(res, { cookies });
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
    capturedSetAll = null;
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

    it("does not redirect /login even though it is a protected path prefix", async () => {
      const response = await proxy(createRequest("/login"));
      expect(response.status).toBe(200);
      expect(response.headers.get("Location")).toBeNull();
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

    it("preserves query string in redirectTo", async () => {
      const response = await proxy(
        createRequest("/resumes/abc/preview?mode=print"),
      );
      const location = response.headers.get("Location") ?? "";
      // The decoded redirectTo should include the query string
      const url = new URL(location);
      const redirectTo = url.searchParams.get("redirectTo");
      expect(redirectTo).toBe("/resumes/abc/preview?mode=print");
    });
  });

  // ── Cookie propagation ──────────────────────────────────

  describe("cookie propagation", () => {
    it("copies Supabase cookies to redirect response on unauthenticated redirect", async () => {
      // Simulate Supabase clearing an auth cookie during getUser().
      // The setAll callback receives { name, value, options } per Supabase SSR types.
      mockGetUser.mockImplementation(async () => {
        capturedSetAll?.(
          [{ name: "sb-access-token", value: "cleared", options: { maxAge: 0 } }],
          {},
        );
        return { data: { user: null }, error: null };
      });

      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(307);

      // The redirect response should carry the cookie Supabase set
      const cookies = (response as unknown as { cookies: MockCookies }).cookies;
      expect(cookies.has("sb-access-token")).toBe(true);
      expect(cookies.get("sb-access-token")?.value).toBe("cleared");
    });

    it("passes cookies through on authenticated response", async () => {
      // Simulate Supabase refreshing a token during getUser()
      mockGetUser.mockImplementation(async () => {
        capturedSetAll?.(
          [{ name: "sb-access-token", value: "refreshed-token", options: {} }],
          {},
        );
        return {
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        };
      });

      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(200);

      // The pass-through response should carry the refreshed cookie
      const cookies = (response as unknown as { cookies: MockCookies }).cookies;
      expect(cookies.has("sb-access-token")).toBe(true);
      expect(cookies.get("sb-access-token")?.value).toBe("refreshed-token");
    });

    it("preserves cookie attributes (path, maxAge, httpOnly) on redirect", async () => {
      mockGetUser.mockImplementation(async () => {
        capturedSetAll?.(
          [
            {
              name: "sb-refresh-token",
              value: "token-value",
              options: {
                path: "/",
                maxAge: 604800,
                httpOnly: true,
                secure: true,
                sameSite: "lax",
              },
            },
          ],
          {},
        );
        return { data: { user: null }, error: null };
      });

      const response = await proxy(createRequest("/dashboard"));
      const cookies = (response as unknown as { cookies: MockCookies }).cookies;
      const cookie = cookies.get("sb-refresh-token");
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe("token-value");
      expect(cookie?.path).toBe("/");
      expect(cookie?.maxAge).toBe(604800);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.secure).toBe(true);
      expect(cookie?.sameSite).toBe("lax");
    });
  });

  // ── Auth error handling ─────────────────────────────────

  describe("auth error handling", () => {
    it("treats getUser error as unauthenticated", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "JWT expired" },
      });

      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("treats thrown exception as unauthenticated", async () => {
      mockGetUser.mockRejectedValue(new Error("Network failure"));

      const response = await proxy(createRequest("/dashboard"));
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });
  });

  // ── Matcher config ───────────────────────────────────────

  describe("matcher config", () => {
    it("excludes API routes from proxy", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("api");
    });

    it("excludes _next static assets", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("_next");
    });

    it("excludes favicon.ico", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("favicon.ico");
    });

    it("excludes sitemap.xml", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("sitemap.xml");
    });

    it("excludes robots.txt", () => {
      const matcher = Array.isArray(config.matcher)
        ? config.matcher[0]
        : config.matcher;
      expect(matcher).toContain("robots.txt");
    });
  });
});
