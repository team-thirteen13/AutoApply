import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  useParams: vi.fn(() => ({ id: "test-resume-id" })),
}));

// ── Import after mocks ─────────────────────────────────────

import {
  saveResumeAction,
  improveSummaryAction,
  improveExperienceAction,
  listResumesAction,
} from "@/app/resumes/actions";
import { deleteResumeAction } from "@/app/dashboard/actions";

// Valid UUID for testing
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ── Tests ───────────────────────────────────────────────────

describe("resume server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
          email_confirmed_at: "2024-01-01",
          created_at: "2024-01-01",
        },
      },
      error: null,
    });

    // Default: chain for queries
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      maybeSingle: mockMaybeSingle,
    });
    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      order: mockOrder,
      maybeSingle: mockMaybeSingle,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockDelete.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      maybeSingle: mockMaybeSingle,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      maybeSingle: mockMaybeSingle,
    });
  });

  describe("saveResumeAction", () => {
    it("returns error when update fails", async () => {
      // First call: updateResume reads existing resume (not found)
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await saveResumeAction(
        VALID_UUID,
        "Updated Resume",
        {},
      );

      expect(result.success).toBe(false);
    });
  });

  describe("deleteResumeAction", () => {
    it("deletes resume and redirects to dashboard", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: VALID_UUID },
        error: null,
      });

      await expect(deleteResumeAction(VALID_UUID)).rejects.toThrow(
        "REDIRECT:/dashboard",
      );
    });

    it("returns error when resume not found", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await deleteResumeAction(VALID_UUID);

      expect(result.success).toBe(false);
    });
  });

  describe("listResumesAction", () => {
    it("returns empty array when no resumes exist", async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await listResumesAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("returns list of resumes", async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: VALID_UUID,
            user_id: "user-1",
            title: "My Resume",
            target_role: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ],
        error: null,
      });

      const result = await listResumesAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("My Resume");
      }
    });
  });
});

describe("AI improve actions", () => {
  it("improveSummaryAction returns improved bio", async () => {
    const result = await improveSummaryAction(
      "I am a developer who built stuff",
    );

    expect(result.data.bio).toBeTruthy();
    expect(result.data.bio).not.toBe("I am a developer who built stuff");
    expect(result.provider).toBe("mock");
  });

  it("improveSummaryAction generates template for empty bio", async () => {
    const result = await improveSummaryAction("");

    expect(result.data.bio).toContain("software engineer");
    expect(result.provider).toBe("mock");
  });

  it("improveExperienceAction returns improved experience", async () => {
    const result = await improveExperienceAction({
      company: "Acme Inc.",
      title: "Developer",
      accomplishments: ["built the thing", "helped with stuff"],
      skills: ["javascript", "javascript"],
    });

    expect(result.data.accomplishments).toHaveLength(2);
    expect(result.data.skills).toHaveLength(1);
    expect(result.provider).toBe("mock");
  });
});

describe("protected resume routes", () => {
  it("export page modules are functions", async () => {
    const newPage = await import("@/app/resumes/new/page");
    expect(typeof newPage.default).toBe("function");

    const editPage = await import("@/app/resumes/[id]/edit/page");
    expect(typeof editPage.default).toBe("function");

    const previewPage = await import("@/app/resumes/[id]/preview/page");
    expect(typeof previewPage.default).toBe("function");
  });
});

describe("deleteResumeAction uniqueness", () => {
  it("has exactly one canonical deleteResumeAction definition", async () => {
    // Verify dashboard actions exports deleteResumeAction
    const dashboardActions = await import("@/app/dashboard/actions");
    expect(typeof dashboardActions.deleteResumeAction).toBe("function");

    // Verify resumes actions does NOT export deleteResumeAction
    const resumesActions = await import("@/app/resumes/actions");
    expect((resumesActions as Record<string, unknown>).deleteResumeAction).toBeUndefined();
  });
});

describe("resume page authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("new resume page redirects when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { default: NewResumePage } = await import(
      "@/app/resumes/new/page"
    );

    await expect(NewResumePage()).rejects.toThrow("REDIRECT:/login");
  });

  it("edit resume page redirects when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { default: EditResumePage } = await import(
      "@/app/resumes/[id]/edit/page"
    );

    await expect(
      EditResumePage({ params: Promise.resolve({ id: VALID_UUID }) }),
    ).rejects.toThrow("REDIRECT:/login");
  });
});
