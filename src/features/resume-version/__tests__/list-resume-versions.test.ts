import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const {
  mockRequireAuthenticatedUser,
  mockFrom,
} = vi.hoisted(() => ({
  mockRequireAuthenticatedUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { listResumeVersions } from "../list-resume-versions";

const VALID_RESUME_ID = "550e8400-e29b-41d4-a716-446655440000";

const DB_ROW = {
  id: "version-1",
  resume_id: VALID_RESUME_ID,
  user_id: "user-123",
  snapshot: { profile: { name: "John" } },
  label: "v1",
  created_at: "2024-01-01T00:00:00Z",
};

function buildResumeCheckChain(resumeData: Record<string, unknown>) {
  const maybeSingle = vi.fn().mockResolvedValue(resumeData);
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  return { select, maybeSingle };
}

function buildVersionListChain(versionData: Record<string, unknown>) {
  const order = vi.fn().mockResolvedValue(versionData);
  const eq2 = vi.fn().mockReturnValue({ order });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  return { select, order };
}

describe("listResumeVersions", () => {
  beforeEach(() => {
    mockRequireAuthenticatedUser.mockReset();
    mockFrom.mockReset();

    mockRequireAuthenticatedUser.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      emailConfirmed: true,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("returns validation_error for invalid resume ID", async () => {
    const result = await listResumeVersions("not-a-uuid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("validation_error");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new (await import("@/types/auth")).AuthenticationRequiredError(),
    );

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns resume_not_found when parent resume missing", async () => {
    const resumeChain = buildResumeCheckChain({ data: null, error: null });
    mockFrom.mockReturnValue(resumeChain);

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("resume_not_found");
    }
  });

  it("returns mapped versions", async () => {
    const resumeChain = buildResumeCheckChain({ data: { id: VALID_RESUME_ID }, error: null });
    const versionChain = buildVersionListChain({ data: [DB_ROW], error: null });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? resumeChain : versionChain;
    });

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("version-1");
      expect(result.data[0].snapshot).toEqual({ profile: { name: "John" } });
    }
  });

  it("normalizes null data to empty array", async () => {
    const resumeChain = buildResumeCheckChain({ data: { id: VALID_RESUME_ID }, error: null });
    const versionChain = buildVersionListChain({ data: null, error: null });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? resumeChain : versionChain;
    });

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("returns unexpected on Supabase error", async () => {
    const resumeChain = buildResumeCheckChain({ data: { id: VALID_RESUME_ID }, error: null });
    const versionChain = buildVersionListChain({
      data: null,
      error: { code: "some_error", message: "Database error" },
    });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? resumeChain : versionChain;
    });

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected on thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(new Error("Unexpected"));

    const result = await listResumeVersions(VALID_RESUME_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });
});
