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

import { updateExperience } from "../update-experience";

const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";

const DB_ROW = {
  id: VALID_ID,
  user_id: "user-123",
  company: "Acme Inc.",
  title: "Developer",
  company_url: null,
  start_date: "2020-01-01",
  end_date: null,
  is_current: true,
  accomplishments: ["Built thing"],
  skills: ["TypeScript"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

function buildReadChain(data: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

describe("updateExperience", () => {
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
    const result = await updateExperience("not-a-uuid", { title: "New" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns validation_error for empty update", async () => {
    const result = await updateExperience(VALID_ID, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError(),
    );
    const result = await updateExperience(VALID_ID, { title: "New" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns experience_not_found when missing", async () => {
    const readChain = buildReadChain(null);
    mockFrom.mockReturnValueOnce(readChain);

    const result = await updateExperience(VALID_ID, { title: "New" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("experience_not_found");
    }
  });

  it("returns updated experience on success", async () => {
    // Build read chain: from().select().eq().eq().maybeSingle()
    const readMaybeSingle = vi.fn().mockResolvedValue({ data: DB_ROW, error: null });
    const readEq2 = vi.fn().mockReturnValue({ maybeSingle: readMaybeSingle });
    const readEq1 = vi.fn().mockReturnValue({ eq: readEq2 });
    const readSelect = vi.fn().mockReturnValue({ eq: readEq1 });
    const readChain = { select: readSelect };

    // Build update chain: from().update().eq().eq().select().maybeSingle()
    const updateMaybeSingle = vi.fn().mockResolvedValue({ data: { ...DB_ROW, title: "New Title" }, error: null });
    const updateSelect = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
    const updateEq2 = vi.fn().mockReturnValue({ select: updateSelect });
    const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });
    const update = vi.fn().mockReturnValue({ eq: updateEq1 });
    const updateChain = { update };

    mockFrom.mockReturnValueOnce(readChain).mockReturnValueOnce(updateChain);

    const result = await updateExperience(VALID_ID, { title: "New Title" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("New Title");
    }
  });

  it("returns unexpected on Supabase error", async () => {
    const readChain = buildReadChain(null);
    readChain.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "some_error", message: "Database error" },
          }),
        }),
      }),
    });
    mockFrom.mockReturnValueOnce(readChain);

    const result = await updateExperience(VALID_ID, { title: "New" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("does not expose raw Supabase errors", async () => {
    const readChain = buildReadChain(null);
    readChain.select.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "some_error", message: "Detailed DB error" },
          }),
        }),
      }),
    });
    mockFrom.mockReturnValueOnce(readChain);

    const result = await updateExperience(VALID_ID, { title: "New" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("DB error");
    }
  });
});
