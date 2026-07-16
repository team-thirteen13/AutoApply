/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.removeAttribute("open");
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const mockListVersionsAction = vi.fn();
const mockRestoreVersionAction = vi.fn();
const mockSaveResumeAction = vi.fn().mockResolvedValue({ success: true, data: { id: "resume-1" } });
const mockImproveSummaryAction = vi.fn().mockResolvedValue({ data: { bio: "Improved" } });
const mockImproveExperienceAction = vi.fn().mockResolvedValue({ data: { accomplishments: [] } });

vi.mock("@/app/resumes/actions", () => ({
  listVersionsAction: (...a: unknown[]) => mockListVersionsAction(...a),
  restoreVersionAction: (...a: unknown[]) => mockRestoreVersionAction(...a),
  saveResumeAction: (...a: unknown[]) => mockSaveResumeAction(...a),
  improveSummaryAction: (...a: unknown[]) => mockImproveSummaryAction(...a),
  improveExperienceAction: (...a: unknown[]) => mockImproveExperienceAction(...a),
}));

vi.mock("@/components/ui/toast", () => ({
  Toast: ({ message, type }: { message: string; type: string }) => (
    <div data-testid="toast" data-type={type}>{message}</div>
  ),
}));

vi.mock("@/components/builder/builder-header", () => ({
  BuilderHeader: ({ title, onSave, onSaveAndPreview, onOpenHistory, versionCount, historyButtonRef }: {
    title: string; onTitleChange: (t: string) => void; completionPercentage: number;
    isSaving: boolean; lastSaved: string | null; onSave: () => void;
    onSaveAndPreview: () => void; onOpenHistory: () => void; versionCount: number;
    historyButtonRef?: React.RefObject<HTMLButtonElement | null>;
  }) => (
    <div data-testid="builder-header">
      <span data-testid="header-title">{title}</span>
      <button data-testid="save-btn" onClick={onSave}>Save</button>
      <button data-testid="save-preview-btn" onClick={onSaveAndPreview}>Save &amp; Preview</button>
      <button ref={historyButtonRef} data-testid="history-btn" onClick={onOpenHistory}>History ({versionCount})</button>
    </div>
  ),
}));

vi.mock("@/components/builder/builder-sidebar", () => ({
  BuilderSidebar: () => <div data-testid="builder-sidebar" />,
  SECTIONS: [
    { id: "personal", label: "Personal" }, { id: "summary", label: "Summary" },
    { id: "experience", label: "Experience" }, { id: "education", label: "Education" },
    { id: "skills", label: "Skills" }, { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" }, { id: "languages", label: "Languages" },
  ],
}));

vi.mock("@/components/builder/mobile-section-nav", () => ({
  MobileSectionNav: () => <div data-testid="mobile-nav" />,
}));

vi.mock("@/components/builder/sections", () => ({
  PersonalInfoForm: () => <div data-testid="personal-form" />,
  SummaryForm: () => <div data-testid="summary-form" />,
  ExperienceForm: () => <div data-testid="experience-form" />,
  EducationForm: () => <div data-testid="education-form" />,
  SkillsForm: () => <div data-testid="skills-form" />,
  ProjectsForm: () => <div data-testid="projects-form" />,
  CertificationsForm: () => <div data-testid="certifications-form" />,
  LanguagesForm: () => <div data-testid="languages-form" />,
  FileUploadForm: () => <div data-testid="file-upload-form" />,
}));

// ── Import after mocks ─────────────────────────────────────

import { ResumeBuilder } from "@/components/builder/resume-builder";
import type { ResumeSnapshot, ResumeVersion } from "@/types/resume";

// ── Test Data ──────────────────────────────────────────────

const baseSnapshot: ResumeSnapshot = {
  profile: { name: "Jane Smith", email: "jane@example.com", title: "Software Engineer" },
  summary: "Experienced software engineer with 5+ years building web apps.",
  skills: [{ name: "TypeScript", category: "technical", proficiency: "advanced" }],
  templateId: "classic",
};

const olderSnapshot: ResumeSnapshot = {
  profile: { name: "Older Version", email: "older@example.com", title: "Junior Dev" },
  summary: "An earlier version of the resume.",
  templateId: "modern",
};

function makeVersion(o: Partial<ResumeVersion> & { id: string; createdAt: string }): ResumeVersion {
  return { resumeId: "resume-1", userId: "user-1", snapshot: baseSnapshot, label: null, ...o };
}

const v1 = makeVersion({ id: "v-1", createdAt: "2026-07-14T10:00:00Z", label: "Initial draft" });
const v2 = makeVersion({ id: "v-2", createdAt: "2026-07-14T12:00:00Z", label: "Saved 7/14/2026, 12:00 PM" });
const v3 = makeVersion({ id: "v-3", createdAt: "2026-07-14T14:00:00Z", label: "Saved 7/14/2026, 2:00 PM", snapshot: olderSnapshot });

// Helper: render, wait for initial count fetch, allow state update
async function renderAndWait(versions: ResumeVersion[], snapshot = baseSnapshot) {
  mockListVersionsAction.mockResolvedValue({ success: true, data: versions });
  render(<ResumeBuilder resumeId="resume-1" initialTitle="Test" initialSnapshot={snapshot} />);
  await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ════════════════════════════════════════════════════════════
// VERSION LISTING
// ════════════════════════════════════════════════════════════

describe("Version listing", () => {
  it("shows loading spinner while versions load", async () => {
    let resolveVersions!: (v: unknown) => void;
    mockListVersionsAction
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockReturnValueOnce(new Promise((r) => { resolveVersions = r; }));

    render(<ResumeBuilder resumeId="r1" initialTitle="T" initialSnapshot={baseSnapshot} />);
    await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Loading versions...")).toBeInTheDocument());
    resolveVersions({ success: true, data: [] });
    await new Promise((r) => setTimeout(r, 0));
  });

  it("shows empty state when no versions", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("No versions yet")).toBeInTheDocument());
  });

  it("shows error when versions fail to load", async () => {
    mockListVersionsAction.mockResolvedValue({ success: false, error: { message: "Load failed" } });
    render(<ResumeBuilder resumeId="r1" initialTitle="T" initialSnapshot={baseSnapshot} />);
    await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Load failed")).toBeInTheDocument());
  });

  it("retry re-fetches versions", async () => {
    mockListVersionsAction
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: false, error: { message: "err" } })
      .mockResolvedValueOnce({ success: true, data: [v1] });

    render(<ResumeBuilder resumeId="r1" initialTitle="T" initialSnapshot={baseSnapshot} />);
    await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("err")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());
  });

  it("displays version labels", async () => {
    await renderAndWait([v1, v2]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => {
      expect(screen.getByText("Initial draft")).toBeInTheDocument();
      expect(screen.getByText("Saved 7/14/2026, 12:00 PM")).toBeInTheDocument();
    });
  });

  it("shows fallback label for null label", async () => {
    await renderAndWait([makeVersion({ id: "v-u", createdAt: "2026-07-14T08:00:00Z", label: null })]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Saved version")).toBeInTheDocument());
  });

  it("displays formatted timestamp", async () => {
    await renderAndWait([v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => {
      const timeEl = screen.getByRole("time");
      expect(timeEl).toHaveAttribute("datetime", "2026-07-14T10:00:00Z");
    });
  });

  it("shows Latest badge on newest version", async () => {
    await renderAndWait([v3, v2, v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getAllByText("Latest")).toHaveLength(1));
  });

  it("displays correct version count in panel", async () => {
    await renderAndWait([v1, v2, v3]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("3 versions")).toBeInTheDocument());
  });

  it("displays singular 'version' for count of 1", async () => {
    await renderAndWait([v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("1 version")).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════
// PREVIEW
// ════════════════════════════════════════════════════════════

describe("Preview", () => {
  it("renders selected version snapshot", async () => {
    await renderAndWait([v3, v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    const previewBtns = screen.getAllByText("Preview");
    fireEvent.click(previewBtns[1]); // older version
    await waitFor(() => expect(screen.getByText("Previewing historical version")).toBeInTheDocument());
  });

  it("closing preview returns to list", async () => {
    await renderAndWait([v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Preview"));
    await waitFor(() => expect(screen.getByText("Previewing historical version")).toBeInTheDocument());

    fireEvent.click(screen.getByText("← Back to list"));
    await waitFor(() => {
      expect(screen.queryByText("Previewing historical version")).not.toBeInTheDocument();
      expect(screen.getByText("Initial draft")).toBeInTheDocument();
    });
  });

  it("legacy snapshot falls back safely in preview", async () => {
    const legacy = makeVersion({
      id: "v-leg", createdAt: "2026-07-14T10:00:00Z", label: "Legacy",
      snapshot: { profile: { name: "Legacy User", email: "leg@test.com" } },
    });
    await renderAndWait([legacy]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Legacy")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Preview"));
    await waitFor(() => {
      expect(screen.getByText("Previewing historical version")).toBeInTheDocument();
      expect(screen.getByText("Legacy User")).toBeInTheDocument();
    });
  });
});

// ════════════════════════════════════════════════════════════
// RESTORE
// ════════════════════════════════════════════════════════════

describe("Restore", () => {
  it("shows confirmation dialog", async () => {
    await renderAndWait([v3, v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Restore")[0]);
    await waitFor(() => expect(screen.getByText("Restore Version")).toBeInTheDocument());
  });

  it("cancel preserves state", async () => {
    await renderAndWait([v3, v1]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Restore")[0]);
    await waitFor(() => expect(screen.getByText("Restore Version")).toBeInTheDocument());

    // Click Cancel button in the confirm dialog
    const cancelBtn = screen.getAllByText("Cancel").find(
      (el) => el.tagName === "SPAN" || el.closest("button"),
    );
    fireEvent.click(cancelBtn!);

    // The key assertion: restore was NOT called
    expect(mockRestoreVersionAction).not.toHaveBeenCalled();
  });

  it("success creates new version and shows toast", async () => {
    await renderAndWait([v3, v1]);
    // Panel open fetch uses same ordering (newest first)
    mockListVersionsAction.mockResolvedValueOnce({ success: true, data: [v3, v1] });
    mockRestoreVersionAction.mockResolvedValue({
      success: true, data: { version: v1, snapshot: v1.snapshot },
    });

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    // v3 is latest, so v1's Restore button is the only one
    fireEvent.click(screen.getAllByText("Restore")[0]);
    await waitFor(() => expect(screen.getByText("Restore Version")).toBeInTheDocument());

    // Click the confirm dialog's Restore button
    const confirmBtn = screen.getByRole("button", { name: "Restore" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRestoreVersionAction).toHaveBeenCalledWith("resume-1", "v-1");
      expect(screen.getByText("Version restored successfully")).toBeInTheDocument();
    });
  });

  it("failure shows error", async () => {
    await renderAndWait([v3, v1]);
    mockRestoreVersionAction.mockResolvedValue({ success: false, error: { message: "Restore failed" } });

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Restore")[0]);
    await waitFor(() => expect(screen.getByText("Restore Version")).toBeInTheDocument());

    const confirmBtn = screen.getByRole("button", { name: "Restore" });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(screen.getByText("Restore failed")).toBeInTheDocument());
  });
});

// ════════════════════════════════════════════════════════════
// INTEGRATION & REGRESSIONS
// ════════════════════════════════════════════════════════════

describe("Integration", () => {
  it("History button appears in builder", async () => {
    await renderAndWait([]);
    expect(screen.getByTestId("history-btn")).toBeInTheDocument();
  });

  it("save increments version count", async () => {
    await renderAndWait([v1]);
    fireEvent.click(screen.getByTestId("save-btn"));
    await waitFor(() => expect(mockSaveResumeAction).toHaveBeenCalled());
    expect(screen.getByTestId("history-btn")).toHaveTextContent("History (2)");
  });

  it("saveResumeAction called with correct args", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("save-btn"));
    await waitFor(() => {
      expect(mockSaveResumeAction).toHaveBeenCalledWith("resume-1", "Test", expect.objectContaining({ profile: expect.any(Object) }));
    });
  });
});

describe("Regressions", () => {
  it("mobile nav renders", async () => {
    await renderAndWait([]);
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();
  });
});

describe("Accessibility", () => {
  it("panel has dialog role and aria-labelledby and aria-modal", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  it("close button has accessible label", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close version history" })).toBeInTheDocument();
    });
  });

  it("Escape key closes the panel", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("focus returns to History button after closing panel", async () => {
    await renderAndWait([]);
    const historyBtn = screen.getByTestId("history-btn");
    fireEvent.click(historyBtn);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    await waitFor(() => {
      expect(historyBtn).toHaveFocus();
    });
  });

  it("errors are announced with role=alert", async () => {
    mockListVersionsAction.mockResolvedValue({ success: false, error: { message: "Network error" } });
    render(<ResumeBuilder resumeId="r1" initialTitle="T" initialSnapshot={baseSnapshot} />);
    await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Network error");
    });
  });

  it("History button is keyboard accessible", async () => {
    await renderAndWait([]);
    const historyBtn = screen.getByTestId("history-btn");
    expect(historyBtn).toBeInTheDocument();
    // Button is focusable by default (native button element)
    historyBtn.focus();
    expect(historyBtn).toHaveFocus();
  });
});

describe("Server-side safety", () => {
  it("listVersionsAction called with resumeId", async () => {
    await renderAndWait([]);
    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(mockListVersionsAction).toHaveBeenCalledWith("resume-1"));
  });

  it("restoreVersionAction called with correct ids", async () => {
    await renderAndWait([v3, v1]);
    mockListVersionsAction.mockResolvedValueOnce({ success: true, data: [v3, v1] });
    mockRestoreVersionAction.mockResolvedValue({
      success: true, data: { version: v1, snapshot: v1.snapshot },
    });

    fireEvent.click(screen.getByTestId("history-btn"));
    await waitFor(() => expect(screen.getByText("Initial draft")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("Restore")[0]);
    await waitFor(() => expect(screen.getByText("Restore Version")).toBeInTheDocument());

    const confirmBtn = screen.getByRole("button", { name: "Restore" });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(mockRestoreVersionAction).toHaveBeenCalledWith("resume-1", "v-1"));
  });
});
