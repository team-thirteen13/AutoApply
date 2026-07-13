// ─────────────────────────────────────────────────────────────
// Proxy-Specific Supabase Client
// ─────────────────────────────────────────────────────────────
// Creates a Supabase client for use in src/proxy.ts.
// Uses request/response cookie pattern compatible with the
// Next.js 16 proxy lifecycle (runs before route rendering).
//
// This is separate from src/lib/supabase/server.ts because
// the server client uses cookies() from next/headers, which
// is not available in the proxy context.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function createProxyClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}
