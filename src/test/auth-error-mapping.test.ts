import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "@/features/auth/auth-error-messages";
import { mapAuthErrorCode } from "@/features/auth/map-auth-error";
import type { AuthErrorCode } from "@/types/auth";

// ── mapAuthErrorCode ────────────────────────────────────────

describe("mapAuthErrorCode", () => {
  it("maps invalid_credentials to invalid_credentials", () => {
    expect(mapAuthErrorCode({ code: "invalid_credentials" })).toBe("invalid_credentials");
  });

  it("maps invalid_grant to invalid_credentials", () => {
    expect(mapAuthErrorCode({ code: "invalid_grant" })).toBe("invalid_credentials");
  });

  it("maps email_exists to email_exists", () => {
    expect(mapAuthErrorCode({ code: "email_exists" })).toBe("email_exists");
  });

  it("maps user_already_exists to email_exists", () => {
    expect(mapAuthErrorCode({ code: "user_already_exists" })).toBe("email_exists");
  });

  it("maps weak_password to weak_password", () => {
    expect(mapAuthErrorCode({ code: "weak_password" })).toBe("weak_password");
  });

  it("maps rate limit codes to rate_limited", () => {
    expect(mapAuthErrorCode({ code: "over_request_rate_limit" })).toBe("rate_limited");
    expect(mapAuthErrorCode({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(mapAuthErrorCode({ code: "over_sms_send_rate_limit" })).toBe("rate_limited");
  });

  it("returns unexpected for unknown codes", () => {
    expect(mapAuthErrorCode({ code: "some_new_supabase_code" })).toBe("unexpected");
  });

  it("returns unexpected for missing code", () => {
    expect(mapAuthErrorCode({})).toBe("unexpected");
    expect(mapAuthErrorCode({ code: undefined })).toBe("unexpected");
  });
});

// ── getAuthErrorMessage ─────────────────────────────────────

describe("getAuthErrorMessage", () => {
  it("invalid_credentials produces specific message", () => {
    const msg = getAuthErrorMessage("invalid_credentials");
    expect(msg).toBe("Invalid email or password. Please check your credentials and try again.");
    // Must not be the generic fallback
    expect(msg).not.toContain("Something went wrong");
  });

  it("email_exists produces specific message", () => {
    const msg = getAuthErrorMessage("email_exists");
    expect(msg).toBe("An account with this email already exists. Try signing in instead.");
  });

  it("rate_limited produces retryable message", () => {
    const msg = getAuthErrorMessage("rate_limited");
    expect(msg).toContain("Too many attempts");
    expect(msg).toContain("try again");
  });

  it("unknown code produces generic message", () => {
    const msg = getAuthErrorMessage("unexpected" as AuthErrorCode);
    expect(msg).toBe("Something went wrong. Please try again later.");
  });

  it("raw Supabase message is never returned", () => {
    const codes: AuthErrorCode[] = [
      "invalid_credentials",
      "email_exists",
      "rate_limited",
      "weak_password",
      "unexpected",
    ];
    for (const code of codes) {
      const msg = getAuthErrorMessage(code);
      // Should not contain typical Supabase internal text
      expect(msg).not.toMatch(/Invalid login credentials/i);
      expect(msg).not.toMatch(/User already registered/i);
      expect(msg).not.toMatch(/Database error/i);
    }
  });
});

// ── Integration: mapAuthErrorCode → getAuthErrorMessage ──────

describe("auth error integration", () => {
  it("invalid_credentials code produces specific safe message end-to-end", () => {
    const code = mapAuthErrorCode({ code: "invalid_credentials" });
    expect(code).toBe("invalid_credentials");
    const msg = getAuthErrorMessage(code);
    expect(msg).toBe("Invalid email or password. Please check your credentials and try again.");
  });

  it("invalid_grant code produces specific safe message end-to-end", () => {
    const code = mapAuthErrorCode({ code: "invalid_grant" });
    expect(code).toBe("invalid_credentials");
    const msg = getAuthErrorMessage(code);
    expect(msg).toBe("Invalid email or password. Please check your credentials and try again.");
  });

  it("email_exists code produces specific safe message end-to-end", () => {
    const code = mapAuthErrorCode({ code: "email_exists" });
    expect(code).toBe("email_exists");
    const msg = getAuthErrorMessage(code);
    expect(msg).toBe("An account with this email already exists. Try signing in instead.");
  });

  it("rate limit code produces retryable safe message end-to-end", () => {
    const code = mapAuthErrorCode({ code: "over_request_rate_limit" });
    expect(code).toBe("rate_limited");
    const msg = getAuthErrorMessage(code);
    expect(msg).toContain("Too many attempts");
  });

  it("unknown Supabase code produces generic safe message end-to-end", () => {
    const code = mapAuthErrorCode({ code: "brand_new_error_code" });
    expect(code).toBe("unexpected");
    const msg = getAuthErrorMessage(code);
    expect(msg).toBe("Something went wrong. Please try again later.");
  });
});
