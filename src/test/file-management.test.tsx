/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { FileUploadForm } from "@/components/builder/sections/file-upload-form";
import { FileManagement } from "@/components/dashboard/file-management";

// ─────────────────────────────────────────────────────────────
// Mock Server Actions
// ─────────────────────────────────────────────────────────────

const mockUploadResumeFileAction = vi.fn();
const mockGetResumeFileUrlAction = vi.fn();
const mockDeleteResumeFileAction = vi.fn();

vi.mock("@/app/resumes/actions", () => ({
  uploadResumeFileAction: (...args: unknown[]) => mockUploadResumeFileAction(...args),
  getResumeFileUrlAction: (...args: unknown[]) => mockGetResumeFileUrlAction(...args),
  deleteResumeFileAction: (...args: unknown[]) => mockDeleteResumeFileAction(...args),
}));

vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={onCancel}>{cancelLabel ?? "Cancel"}</button>
        <button onClick={onConfirm}>{confirmLabel ?? "Confirm"}</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/toast", () => ({
  Toast: ({ message }: { message: string }) => (
    <div data-testid="toast">{message}</div>
  ),
}));

vi.mock("@/features/resume-storage/resume-storage-path", () => ({
  extractDisplayFileName: (filePath: string) => {
    // Simple mock: extract filename after last UUID prefix or just the last segment
    const parts = filePath.split("/");
    const lastPart = parts[parts.length - 1] || "";
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(.+)/i;
    const match = lastPart.match(uuidPattern);
    return match ? match[1] : lastPart;
  },
}));

// ─────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────

const RESUME_ID = "550e8400-e29b-41d4-a716-446655440000";
const UUID_PATH = "550e8400-e29b-41d4-a716-446655440000";

function makeFile(
  name = "resume.pdf",
  size = 1024,
  type = "application/pdf",
): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

// ─────────────────────────────────────────────────────────────
// FileUploadForm Tests
// ─────────────────────────────────────────────────────────────

describe("FileUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadResumeFileAction.mockResolvedValue({
      success: true,
      data: { filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf`, contentType: "application/pdf", size: 1024 },
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Validation", () => {
    it("shows upload area when no file exists", () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/browse/i)).toBeInTheDocument();
    });

    it("shows allowed file types", () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      expect(screen.getByText(/PDF, DOCX up to 10MB/i)).toBeInTheDocument();
    });

    it("rejects unsupported file type", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.txt", 1024, "text/plain");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      expect(mockUploadResumeFileAction).not.toHaveBeenCalled();
    });

    it("rejects oversized file", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 11 * 1024 * 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      expect(mockUploadResumeFileAction).not.toHaveBeenCalled();
    });

    it("rejects empty file", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 0, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText(/file is empty/i)).toBeInTheDocument();
      expect(mockUploadResumeFileAction).not.toHaveBeenCalled();
    });

    it("accepts valid PDF file", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadResumeFileAction).toHaveBeenCalledWith(RESUME_ID, file);
      });
    });

    it("accepts valid DOCX file", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile(
        "resume.docx",
        1024,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUploadResumeFileAction).toHaveBeenCalledWith(RESUME_ID, file);
      });
    });
  });

  describe("Upload", () => {
    it("shows uploading state during upload", async () => {
      let resolveUpload: (value: unknown) => void;
      mockUploadResumeFileAction.mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve; }),
      );

      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/uploading file/i)).toBeInTheDocument();
      });

      // Resolve the upload
      resolveUpload!({
        success: true,
        data: { filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` },
      });

      await waitFor(() => {
        expect(screen.queryByText(/uploading file/i)).not.toBeInTheDocument();
      });
    });

    it("shows indeterminate progress without percentage", async () => {
      let resolveUpload: (value: unknown) => void;
      mockUploadResumeFileAction.mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve; }),
      );

      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/uploading file/i)).toBeInTheDocument();
      });

      // Should NOT show percentage
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();

      resolveUpload!({
        success: true,
        data: { filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` },
      });

      await waitFor(() => {
        expect(screen.queryByText(/uploading file/i)).not.toBeInTheDocument();
      });
    });

    it("has role status during upload", async () => {
      let resolveUpload: (value: unknown) => void;
      mockUploadResumeFileAction.mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve; }),
      );

      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      resolveUpload!({
        success: true,
        data: { filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` },
      });

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("shows error on upload failure", async () => {
      mockUploadResumeFileAction.mockResolvedValue({
        success: false,
        error: "Failed to upload file",
      });

      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to upload file")).toBeInTheDocument();
    });

    it("shows success state after upload", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("resume.pdf")).toBeInTheDocument();
      });
    });
  });

  describe("Existing File", () => {
    it("shows file info when file exists", () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
      expect(screen.getByText("Uploaded")).toBeInTheDocument();
    });

    it("extracts display filename from UUID path", () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-my-resume.pdf` }}
        />,
      );

      expect(screen.getByText("my-resume.pdf")).toBeInTheDocument();
    });

    it("shows open and download buttons with filename", () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByLabelText("Open resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Download resume.pdf")).toBeInTheDocument();
    });

    it("opens file in new tab", async () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/resume.pdf" },
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Open resume.pdf"));

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith("https://signed.example.com/resume.pdf", "_blank");
      });

      vi.unstubAllGlobals();
    });

    it("download uses display filename", async () => {
      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/resume.pdf" },
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-my-resume.pdf` }}
        />,
      );

      // Verify the download button has the correct label
      expect(screen.getByLabelText("Download my-resume.pdf")).toBeInTheDocument();

      // Verify getResumeFileUrlAction is called when download is clicked
      fireEvent.click(screen.getByLabelText("Download my-resume.pdf"));

      await waitFor(() => {
        expect(mockGetResumeFileUrlAction).toHaveBeenCalledWith(RESUME_ID);
      });
    });

    it("shows delete button with filename", () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByLabelText("Delete resume.pdf")).toBeInTheDocument();
    });

    it("delete opens confirmation dialog", async () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      });

      expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      expect(screen.getByText(/this removes the uploaded file from this resume/i)).toBeInTheDocument();

      // Should NOT have called delete yet
      expect(mockDeleteResumeFileAction).not.toHaveBeenCalled();
    });

    it("cancel preserves file", async () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
      });

      // File should still be visible
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
      expect(mockDeleteResumeFileAction).not.toHaveBeenCalled();
    });

    it("confirm deletes exactly once", async () => {
      mockDeleteResumeFileAction.mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockDeleteResumeFileAction).toHaveBeenCalledTimes(1);
        expect(mockDeleteResumeFileAction).toHaveBeenCalledWith(RESUME_ID);
      });
    });

    it("failure preserves file", async () => {
      mockDeleteResumeFileAction.mockResolvedValue({
        success: false,
        error: "Failed to delete file",
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to delete file")).toBeInTheDocument();
    });

    it("success removes file and shows upload area", async () => {
      mockDeleteResumeFileAction.mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      });

      expect(screen.queryByText("resume.pdf")).not.toBeInTheDocument();
    });

    it("existing filename survives remount", () => {
      const { unmount } = render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByText("resume.pdf")).toBeInTheDocument();

      unmount();

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("highlights drop zone on drag over", () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const dropZone = screen.getByText(/drag and drop/i).closest("div")!;
      fireEvent.dragOver(dropZone);

      expect(dropZone.className).toContain("border-blue-400");
    });

    it("removes highlight on drag leave", () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const dropZone = screen.getByText(/drag and drop/i).closest("div")!;
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      const classes = dropZone.className.split(" ");
      const hasBorderBlue = classes.some(
        (c) => c === "border-blue-400" && !c.startsWith("hover:"),
      );
      expect(hasBorderBlue).toBe(false);
      expect(dropZone.className).toContain("hover:border-blue-400");
    });

    it("uploads file on drop", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const dropZone = screen.getByText(/drag and drop/i).closest("div")!;
      const file = makeFile("resume.pdf", 1024, "application/pdf");

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(mockUploadResumeFileAction).toHaveBeenCalledWith(RESUME_ID, file);
      });
    });
  });

  describe("Accessibility", () => {
    it("has labeled file input", () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      expect(screen.getByLabelText(/upload resume file/i)).toBeInTheDocument();
    });

    it("has role alert for errors", async () => {
      render(<FileUploadForm resumeId={RESUME_ID} />);

      const input = screen.getByLabelText(/upload resume file/i);
      const file = makeFile("resume.txt", 1024, "text/plain");

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("has accessible labels with filename", () => {
      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.pdf` }}
        />,
      );

      expect(screen.getByLabelText("Open resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Download resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete resume.pdf")).toBeInTheDocument();
    });

    it("DOCX download preserves .docx extension", async () => {
      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/resume.docx" },
      });

      render(
        <FileUploadForm
          resumeId={RESUME_ID}
          existingFile={{ filePath: `${RESUME_ID}/${UUID_PATH}-resume.docx` }}
        />,
      );

      // Verify the download button has the correct label with .docx extension
      expect(screen.getByLabelText("Download resume.docx")).toBeInTheDocument();

      // Verify getResumeFileUrlAction is called when download is clicked
      fireEvent.click(screen.getByLabelText("Download resume.docx"));

      await waitFor(() => {
        expect(mockGetResumeFileUrlAction).toHaveBeenCalledWith(RESUME_ID);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────
// FileManagement Tests
// ─────────────────────────────────────────────────────────────

describe("FileManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Empty State", () => {
    it("shows no file attached when filePath is null", () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={null}
        />,
      );

      expect(screen.getByText(/no file attached/i)).toBeInTheDocument();
    });

    it("shows no file attached when filePath is empty string", () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath=""
        />,
      );

      expect(screen.getByText(/no file attached/i)).toBeInTheDocument();
    });
  });

  describe("File Attached State", () => {
    it("shows file attached indicator", () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      expect(screen.getByText(/file attached/i)).toBeInTheDocument();
    });

    it("shows open, download, and delete buttons with filename", () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      expect(screen.getByLabelText("Open resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Download resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete resume.pdf")).toBeInTheDocument();
    });
  });

  describe("Open File", () => {
    it("opens file in new tab", async () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/resume.pdf" },
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Open resume.pdf"));

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith("https://signed.example.com/resume.pdf", "_blank");
      });

      vi.unstubAllGlobals();
    });

    it("shows error on failure", async () => {
      mockGetResumeFileUrlAction.mockResolvedValue({
        success: false,
        error: "Failed to get URL",
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Open resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Failed to get URL")).toBeInTheDocument();
      });
    });
  });

  describe("Download File", () => {
    it("download uses display filename not hardcoded .pdf", async () => {
      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/resume.docx" },
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.docx`}
        />,
      );

      // Verify the download button has the correct label with .docx extension
      expect(screen.getByLabelText("Download resume.docx")).toBeInTheDocument();

      // Verify getResumeFileUrlAction is called when download is clicked
      fireEvent.click(screen.getByLabelText("Download resume.docx"));

      await waitFor(() => {
        expect(mockGetResumeFileUrlAction).toHaveBeenCalledWith(RESUME_ID);
      });
    });

    it("download filename derived from extractDisplayFileName not hardcoded", async () => {
      mockGetResumeFileUrlAction.mockResolvedValue({
        success: true,
        data: { url: "https://signed.example.com/file" },
      });

      // The mock extractDisplayFileName returns "resume.docx" for this path
      // This verifies we don't hardcode .pdf in the fallback
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.docx`}
        />,
      );

      expect(screen.getByLabelText("Download resume.docx")).toBeInTheDocument();
      // The label should NOT contain ".pdf" - it should use the actual extension
      expect(screen.queryByLabelText("Download resume.docx.pdf")).not.toBeInTheDocument();
    });
  });

  describe("Delete File", () => {
    it("shows confirmation dialog with correct text", async () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      });

      expect(screen.getByText(/this removes the uploaded file from this resume/i)).toBeInTheDocument();
    });

    it("cancels delete when cancel clicked", async () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByText("Delete uploaded file?")).not.toBeInTheDocument();
      });

      expect(mockDeleteResumeFileAction).not.toHaveBeenCalled();
    });

    it("deletes file when confirmed", async () => {
      mockDeleteResumeFileAction.mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockDeleteResumeFileAction).toHaveBeenCalledWith(RESUME_ID);
      });
    });

    it("shows error on delete failure", async () => {
      mockDeleteResumeFileAction.mockResolvedValue({
        success: false,
        error: "Failed to delete file",
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(screen.getByText("Failed to delete file")).toBeInTheDocument();
      });
    });

    it("calls onFileDeleted callback after successful delete", async () => {
      const onFileDeleted = vi.fn();
      mockDeleteResumeFileAction.mockResolvedValue({
        success: true,
        data: { deleted: true },
      });

      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
          onFileDeleted={onFileDeleted}
        />,
      );

      fireEvent.click(screen.getByLabelText("Delete resume.pdf"));

      await waitFor(() => {
        expect(screen.getByText("Delete uploaded file?")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(onFileDeleted).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible button labels with filename", () => {
      render(
        <FileManagement
          resumeId={RESUME_ID}
          resumeTitle="My Resume"
          filePath={`${RESUME_ID}/${UUID_PATH}-resume.pdf`}
        />,
      );

      expect(screen.getByLabelText("Open resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Download resume.pdf")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete resume.pdf")).toBeInTheDocument();
    });
  });
});
