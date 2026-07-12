// ─────────────────────────────────────────────────────────────
// Supabase Key Selection
// ─────────────────────────────────────────────────────────────
// Shared helper for selecting the Supabase API key.
// Uses direct static NEXT_PUBLIC_ references for Next.js
// browser-bundle inlining. No dynamic process.env lookup.
// No server-only, next/headers, or @supabase/ssr imports.
// ─────────────────────────────────────────────────────────────

export function getSupabaseKey(): string {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (publishable) return publishable;

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anon) return anon;

  throw new Error(
    "Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
}
