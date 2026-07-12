import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock server-only boundary ──────────────────────────────
vi.mock("server-only", () => ({}));

// ── Mock Supabase client ───────────────────────────────────
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
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
import { getProfile } from "@/features/profile/get-profile";
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

// ── Setup ──────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();

  mockCreateClient.mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    }),
  });
});

// ── Tests ──────────────────────────────────────────────────
describe("getProfile", () => {
  it("returns a mapped Profile on success", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    const result = await getProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: "profile-001",
        userId: "user-abc-123",
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "+1-555-0100",
        location: "San Francisco, CA",
        githubUrl: "https://github.com/alice",
        linkedinUrl: "https://linkedin.com/in/alice",
        portfolioUrl: "https://alice.dev",
        tagline: "Full-stack developer",
        bio: "Building things on the web.",
        imageUrl: "https://cdn.example.com/alice.jpg",
        createdAt: "2026-01-15T10:00:00Z",
        updatedAt: "2026-06-20T14:30:00Z",
      });
    }
  });

  it("maps snake_case database fields to camelCase", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    const result = await getProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      const profile = result.data;
      expect(profile).not.toHaveProperty("user_id");
      expect(profile).not.toHaveProperty("github_url");
      expect(profile).not.toHaveProperty("linkedin_url");
      expect(profile).not.toHaveProperty("portfolio_url");
      expect(profile).not.toHaveProperty("image_url");
      expect(profile).not.toHaveProperty("created_at");
      expect(profile).not.toHaveProperty("updated_at");

      expect(profile).toHaveProperty("userId");
      expect(profile).toHaveProperty("githubUrl");
      expect(profile).toHaveProperty("linkedinUrl");
      expect(profile).toHaveProperty("portfolioUrl");
      expect(profile).toHaveProperty("imageUrl");
      expect(profile).toHaveProperty("createdAt");
      expect(profile).toHaveProperty("updatedAt");
    }
  });

  it("returns authentication_required for AuthenticationRequiredError", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new AuthenticationRequiredError()
    );

    const result = await getProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("authentication_required");
    }
  });

  it("returns profile_not_found for null data", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("profile_not_found");
    }
  });

  it("returns unexpected for Supabase error", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "connection refused" },
    });

    const result = await getProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("returns unexpected for other thrown errors", async () => {
    mockRequireAuthenticatedUser.mockRejectedValue(
      new Error("something broke")
    );

    const result = await getProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("unexpected");
    }
  });

  it("calls requireAuthenticatedUser", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    await getProfile();

    expect(mockRequireAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  it("queries with .eq('user_id', user.id)", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    await getProfile();

    expect(mockEq).toHaveBeenCalledWith("user_id", "user-abc-123");
  });

  it("selects explicit PROFILE_COLUMNS", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    await getProfile();

    const expectedColumns =
      "id, user_id, name, email, phone, location, github_url, linkedin_url, portfolio_url, tagline, bio, image_url, created_at, updated_at";
    expect(mockSelect).toHaveBeenCalledWith(expectedColumns);
  });

  it("uses maybeSingle()", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(MOCK_USER);
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROFILE_ROW, error: null });

    await getProfile();

    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
  });
});
