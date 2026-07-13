// ─────────────────────────────────────────────────────────────
// Proxy — Centralized Route Protection
// ─────────────────────────────────────────────────────────────
// Next.js 16 proxy (replaces deprecated middleware.ts).
// Protects authenticated routes by checking for a valid
// Supabase session. Redirects unauthenticated users to
// /login with a redirectTo query parameter.
//
// This is a first-line guard, not the final authorization
// boundary. Backend ownership checks and Supabase RLS remain
// the source of truth for data access.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy";

// ── Protected routes ──────────────────────────────────────
// These paths require an authenticated session.

const PROTECTED_PATHS = ["/dashboard", "/resumes", "/profile"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

// ── Proxy function ────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes, API routes, auth routes, and static assets
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Skip non-protected paths
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Create a response to pass to the Supabase client.
  // Cookies set by Supabase (e.g. token refresh or cleanup)
  // are written here via the setAll callback in createProxyClient.
  const response = NextResponse.next();

  const supabase = createProxyClient(request, response);

  // getUser() validates the JWT server-side. On any failure
  // (network error, invalid token, expired session with no
  // refresh token), treat as unauthenticated — fail closed.
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
    error: { message: "getUser failed" },
  }));

  if (!user) {
    // Build login URL with return destination (preserving query string)
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      request.nextUrl.pathname + request.nextUrl.search,
    );

    const redirectResponse = NextResponse.redirect(loginUrl);

    // Copy any cookies Supabase wrote to the intermediate response
    // (e.g. cleared or refreshed auth cookies) onto the redirect
    // response so they reach the browser.
    response.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie),
    );

    return redirectResponse;
  }

  return response;
}

// ── Matcher ───────────────────────────────────────────────
// Run proxy on all routes except API routes, static assets,
// and Next.js internals. Auth routes and public pages are
// allowed through by the proxy function logic above.

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
