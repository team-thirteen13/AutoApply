import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock server-only boundary ──────────────────────────────
vi.mock("server-only", () => ({}));

// ── Mock Supabase client ───────────────────────────────────
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockCreateClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

// ── Mock session utilities ─────────────────────────────────
const mockRequireAuthenticatedUser = vi.fn();

vi.mock("@/lib/supabase/session", () => ({
  requireAuthenticatedUser: (...args: unknown[]) =>
    mockRequireAuthenticatedUser(...args),
}));

// ── Import after mocks ─────────────────────────────────────
import { updateProfile } from "@/features/profile/update-profile";
import { AuthenticationRequiredError } from "@/types/auth";

// ── Test data ──────────────────────────────────────────────
const MOCK_USER = {
  id: "user-abc-123",
  email: "alice@example.com",
  emailConfirmed: true,
  createdAt: "2026-01-15T10:00:00Z",
};

const MOCK_PROFILE_ROW = {
  id: "profile-001",
  user_id: "user-abc-123",
  name: "Alice Johnson",
  email: "alice@example.com",
  phone: "+1-555-0100",
  location: "San Francisco, CA",
  github_url: "https://github.com/alice",
  linkedin_url: "https://linkedin.com/in/alice",
  portfolio_url: "https://alice.dev",
  tagline: "Full-stack developer",
  bio: "Building things on the web.",
  image_url: "https://cdn.example.com/alice.jpg",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-06-20T14:30:00Z",
};

// ── Forbidden fields ───────────────────────────────────────
const FORBIDDEN_FIELDS = [
  { key: "id", value: "hacked" },
  { key: "userId", value: "hacked" },
  { key: "user_id", value: "hacked" },
  { key: "email", value: "hacked@test.com" },
  { key: "createdAt", value: "2026-01-01" },
  { key: "created_at", value: "2026-01-01" },
  { key: "updatedAt", value: "2026-01-01" },
  { key: "updated_at", value: "2026-01-01" },
];

// ── Invalid inputs (non-forbidden) ─────────────────────────
const INVALID_INPUTS = [
  { label: "empty object", input: {} },
  { label: "undefined-only name", input: { name: undefined } },
  { label: "unknown key", input: { name: "Test", unknownField: "nope" } },
  { label: "invalid URL", input: { githubUrl: "not-a-url" } },
  { label: "whitespace-only name", input: { name: "   " } },
  { label: "whitespace-only phone", input: { phone: "   " } },
  { label: "whitespace-only location", input: { location: "   " } },
];

// ── Setup ──────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();

  mockCreateClient.mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
      update: mockUpdate,
    }),
  });
});

// ── Helpers ────────────────────────────────────────────────
function expectNoBackendCalls() {
  expect(mockRequireAuthenticatedUser).not.toHaveBeenCalled();
  expect(mockCreateClient).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
}

function expectValidationError(result: Awaited<ReturnType<typeof updateProfile>>) {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe("validation_error");
  }
}

function setupAuthenticatedSuccess() {
  mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
  mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });
}

// ── Tests ──────────────────────────────────────────────────
describe("updateProfile", () => {
  it("returns a mapped Profile for a valid partial update", async () => {
    setupAuthenticatedSuccess();

    const result = await updateProfile({ name: "Alice J." });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice Johnson");
    }
  });

  it("returns authentication_required when not authenticated", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError()
    );

    const result = await updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns profile_not_found when no row is updated", async () => {
    setupAuthenticatedSuccess();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("profile_not_found");
    }
  });

  it("returns unexpected for Supabase error", async () => {
    setupAuthenticatedSuccess();
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection refused" },
    });

    const result = await updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected for another thrown error", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new Error("something broke")
    );

    const result = await updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  // ── Forbidden field rejection (parameterized) ───────────
  describe("forbidden field rejection", () => {
    for (const { key, value } of FORBIDDEN_FIELDS) {
      it(`rejects ${key} without calling auth or Supabase`, async () => {
        const result = await updateProfile({ [key]: value });

        expectValidationError(result);
        expectNoBackendCalls();
      });
    }
  });

  // ── Invalid input rejection (parameterized) ─────────────
  describe("invalid input rejection", () => {
    for (const { label, input } of INVALID_INPUTS) {
      it(`rejects ${label} without calling auth or Supabase`, async () => {
        const result = await updateProfile(input);

        expectValidationError(result);
        expectNoBackendCalls();
      });
    }
  });

  // ── Null clearing and empty string ──────────────────────
  it("accepts { bio: null } and sends null to Supabase", async () => {
    setupAuthenticatedSuccess();

    const result = await updateProfile({ bio: null });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bio: null })
    );
  });

  it("accepts { bio: '' } and preserves the empty string", async () => {
    setupAuthenticatedSuccess();

    const result = await updateProfile({ bio: "" });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bio: "" })
    );
  });

  // ── Omitted fields ─────────────────────────────────────
  it("omits unchanged fields from the update object", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Alice J." });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).toEqual({ name: "Alice J." });
    expect(updateCall).not.toHaveProperty("phone");
    expect(updateCall).not.toHaveProperty("location");
    expect(updateCall).not.toHaveProperty("bio");
  });

  // ── snake_case mapping ──────────────────────────────────
  it("maps camelCase input to snake_case database columns", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({
      githubUrl: "https://github.com/new",
      linkedinUrl: "https://linkedin.com/in/new",
      portfolioUrl: "https://new.dev",
      imageUrl: "https://cdn.example.com/new.jpg",
    });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).toHaveProperty("github_url");
    expect(updateCall).toHaveProperty("linkedin_url");
    expect(updateCall).toHaveProperty("portfolio_url");
    expect(updateCall).toHaveProperty("image_url");
    expect(updateCall).not.toHaveProperty("githubUrl");
    expect(updateCall).not.toHaveProperty("linkedinUrl");
    expect(updateCall).not.toHaveProperty("portfolioUrl");
    expect(updateCall).not.toHaveProperty("imageUrl");
  });

  // ── Forbidden fields not in Supabase update ─────────────
  it("does not send forbidden fields in update to Supabase", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Test" });

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty("id");
    expect(updateCall).not.toHaveProperty("userId");
    expect(updateCall).not.toHaveProperty("user_id");
    expect(updateCall).not.toHaveProperty("email");
    expect(updateCall).not.toHaveProperty("createdAt");
    expect(updateCall).not.toHaveProperty("created_at");
    expect(updateCall).not.toHaveProperty("updatedAt");
    expect(updateCall).not.toHaveProperty("updated_at");
  });

  // ── Post-update query ───────────────────────────────────
  it("selects explicit PROFILE_COLUMNS after update", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Test" });

    const expectedColumns =
      "id, user_id, name, email, phone, location, github_url, linkedin_url, portfolio_url, tagline, bio, image_url, created_at, updated_at";
    expect(mockSelect).toHaveBeenCalledWith(expectedColumns);
  });

  it("uses maybeSingle() after update", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Test" });

    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
  });

  // ── Authorization ───────────────────────────────────────
  it("calls requireAuthenticatedUser", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Test" });

    expect(mockRequireAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  it("queries with .eq('user_id', user.id)", async () => {
    setupAuthenticatedSuccess();

    await updateProfile({ name: "Test" });

    expect(mockEq).toHaveBeenCalledWith("user_id", "user-abc-123");
  });
});
