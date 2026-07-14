"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "@/types/resume-upload";
import {
  uploadResumeFileAction,
  getResumeFileUrlAction,
  deleteResumeFileAction,
} from "@/app/resumes/actions";
import { extractDisplayFileName } from "@/features/resume-storage/resume-storage-path";

// ─────────────────────────────────────────────────────────────
// File Upload Form
// ─────────────────────────────────────────────────────────────
// Allows users to upload, view, download, and delete resume files.
// Validates file type and size before upload.
// Delete requires confirmation via ConfirmDialog.
// ─────────────────────────────────────────────────────────────

interface FileUploadFormProps {
  resumeId: string;
  existingFile?: {
    filePath: string;
    originalName?: string;
  } | null;
  onFileChange?: (hasFile: boolean) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

const MAX_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
const ALLOWED_TYPES_TEXT = "PDF, DOCX";

export function FileUploadForm({
  resumeId,
  existingFile,
  onFileChange,
}: FileUploadFormProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(
    existingFile?.filePath ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive display filename from storage path
  const displayFileName = filePath
    ? extractDisplayFileName(filePath)
    : null;

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size === 0) {
      return "File is empty";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File exceeds maximum size of ${MAX_SIZE_MB}MB`;
    }

    // Check MIME type
    const allowedMimes = ALLOWED_MIME_TYPES as readonly string[];
    if (!allowedMimes.includes(file.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES_TEXT}`;
    }

    // Check extension
    const name = file.name.toLowerCase();
    const allowedExts = ALLOWED_EXTENSIONS as readonly string[];
    const hasValidExt = allowedExts.some((ext) => name.endsWith(ext));
    if (!hasValidExt) {
      return `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }

    return null;
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMessage(validationError);
        setUploadState("error");
        return;
      }

      // Start upload
      setUploadState("uploading");
      setErrorMessage(null);

      try {
        const result = await uploadResumeFileAction(resumeId, file);

        if (result.success) {
          const { filePath: newFilePath } = result.data as { filePath: string };
          setFilePath(newFilePath);
          setUploadState("success");
          onFileChange?.(true);

          // Reset to idle after brief success display
          setTimeout(() => {
            setUploadState("idle");
          }, 2000);
        } else {
          setUploadState("error");
          setErrorMessage(result.error);
        }
      } catch {
        setUploadState("error");
        setErrorMessage("An unexpected error occurred");
      }
    },
    [resumeId, validateFile, onFileChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload],
  );

  const handleOpenFile = useCallback(async () => {
    try {
      const result = await getResumeFileUrlAction(resumeId);
      if (result.success) {
        const { url } = result.data as { url: string };
        window.open(url, "_blank");
      } else {
        setErrorMessage(result.error);
        setUploadState("error");
      }
    } catch {
      setErrorMessage("Failed to open file");
      setUploadState("error");
    }
  }, [resumeId]);

  const handleDownloadFile = useCallback(async () => {
    try {
      const result = await getResumeFileUrlAction(resumeId);
      if (result.success) {
        const { url } = result.data as { url: string };
        const link = document.createElement("a");
        link.href = url;
        // Use display filename for download (preserves original extension)
        link.download = displayFileName ?? "resume.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setErrorMessage(result.error);
        setUploadState("error");
      }
    } catch {
      setErrorMessage("Failed to download file");
      setUploadState("error");
    }
  }, [resumeId, displayFileName]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteConfirmOpen(false);
    setIsDeleting(true);

    try {
      const result = await deleteResumeFileAction(resumeId);
      if (result.success) {
        setFilePath(null);
        setUploadState("idle");
        onFileChange?.(false);
      } else {
        setErrorMessage(result.error);
        setUploadState("error");
      }
    } catch {
      setErrorMessage("Failed to delete file");
      setUploadState("error");
    } finally {
      setIsDeleting(false);
    }
  }, [resumeId, onFileChange]);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
    setUploadState("idle");
  }, []);

  const hasFile = !!filePath && uploadState !== "error";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Resume File</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload your resume file (PDF or DOCX, max {MAX_SIZE_MB}MB)
        </p>
      </div>

      {/* File exists - show info and actions */}
      {hasFile && uploadState !== "uploading" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {displayFileName}
              </p>
              <p className="text-xs text-slate-500">Uploaded</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFile}
                aria-label={`Open ${displayFileName}`}
              >
                Open
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadFile}
                aria-label={`Download ${displayFileName}`}
              >
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isDeleting}
                aria-label={`Delete ${displayFileName}`}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload area */}
      {(!hasFile || uploadState === "uploading") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          }`}
        >
          {uploadState === "uploading" ? (
            <div
              className="space-y-3"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-slate-700">
                Uploading file…
              </p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                Drag and drop your file here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {ALLOWED_TYPES_TEXT} up to {MAX_SIZE_MB}MB
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={uploadState === "uploading"}
            className="sr-only"
            aria-label="Upload resume file"
          />
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">{errorMessage}</p>
              <button
                type="button"
                onClick={handleDismissError}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete uploaded file?"
        description="This removes the uploaded file from this resume. The resume itself will not be deleted."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
