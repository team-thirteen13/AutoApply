// ─────────────────────────────────────────────────────────────
// Supabase Key Selection Tests
// ─────────────────────────────────────────────────────────────
// Tests for src/lib/supabase/env.ts
// Validates key selection logic without network calls
// or Supabase client instantiation.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, vi, afterEach } from "vitest";

import { getSupabaseKey } from "../env";

describe("getSupabaseKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns publishable key when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk_publishable");
    expect(getSupabaseKey()).toBe("pk_publishable");
  });

  it("returns anon key when publishable key is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "pk_anon");
    expect(getSupabaseKey()).toBe("pk_anon");
  });

  it("prefers publishable key when both are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk_publishable");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "pk_anon");
    expect(getSupabaseKey()).toBe("pk_publishable");
  });

  it("throws when neither key exists", () => {
    expect(() => getSupabaseKey()).toThrow(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  });
});
