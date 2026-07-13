import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationRequiredError } from "@/types/auth";

vi.mock("server-only", () => ({}));

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { deleteExperience } from "../delete-experience";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

function buildDeleteChain(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const eq2 = vi.fn().mockReturnValue({ select });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const del = vi.fn().mockReturnValue({ eq: eq1 });
  return { delete: del };
}

describe("deleteExperience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for invalid UUID", async () => {
    const result = await deleteExperience("not-a-uuid");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );
    const result = await deleteExperience(VALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns experience_not_found when missing", async () => {
    const chain = buildDeleteChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(chain);

    const result = await deleteExperience(VALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("experience_not_found");
    }
  });

  it("deletes experience on success", async () => {
    const chain = buildDeleteChain({ data: { id: VALID_ID }, error: null });
    mockFrom.mockReturnValueOnce(chain);

    const result = await deleteExperience(VALID_ID);
    expect(result.success).toBe(true);
  });

  it("returns unexpected on Supabase error", async () => {
    const chain = buildDeleteChain({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });
    mockFrom.mockReturnValueOnce(chain);

    const result = await deleteExperience(VALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("does not expose raw Supabase errors", async () => {
    const chain = buildDeleteChain({
      data: null,
      error: { code: "some_error", message: "Detailed DB error" },
    });
    mockFrom.mockReturnValueOnce(chain);

    const result = await deleteExperience(VALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("DB error");
    }
  });
});
