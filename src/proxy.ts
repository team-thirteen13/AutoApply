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

const PROTECTED_PATHS = ["/dashboard", "/resumes"];

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
  // Cookies set by Supabase (e.g. token refresh) will be
  // included in this response.
  let response = NextResponse.next();

  const supabase = createProxyClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Build login URL with return destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);

    response = NextResponse.redirect(loginUrl);
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
