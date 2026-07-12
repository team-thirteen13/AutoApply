// ─────────────────────────────────────────────────────────────
// Session Refresh Proxy (replaces deprecated middleware.ts)
// ─────────────────────────────────────────────────────────────
// Runs on every matched request. Refreshes the Supabase auth
// session and protects authenticated routes.
//
// Cloudflare compatible: uses @supabase/ssr with request/response
// cookie pattern (no Node.js-only APIs).
// ─────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ── Protected routes (require authentication) ───────────────

const protectedRoutes = ["/dashboard"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

// ── Main proxy handler ──────────────────────────────────────

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set cookies on the request (for downstream Server Components)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        // Rebuild response with updated request headers
        response = NextResponse.next({
          request: { headers: request.headers },
        });

        // Set cookies on the response (for the browser)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session — this exchanges the refresh token for a
  // new access token and updates the cookies via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route protection ──────────────────────────────────────
  // If the route requires authentication and there is no session,
  // redirect to /login with the original path as a query param.

  if (isProtectedRoute(request.nextUrl.pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// ── Route matcher ───────────────────────────────────────────
// Run on all routes except static files and Next.js internals.

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
