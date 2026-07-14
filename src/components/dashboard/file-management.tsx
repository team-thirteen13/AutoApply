"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import {
  getResumeFileUrlAction,
  deleteResumeFileAction,
} from "@/app/resumes/actions";
import { extractDisplayFileName } from "@/features/resume-storage/resume-storage-path";

// ─────────────────────────────────────────────────────────────
// File Management
// ─────────────────────────────────────────────────────────────
// Client component for managing resume file attachments.
// Shows file info, download/open actions, and delete with
// confirmation. Used on dashboard resume cards.
// ─────────────────────────────────────────────────────────────

interface FileManagementProps {
  resumeId: string;
  resumeTitle: string;
  filePath: string | null;
  onFileDeleted?: () => void;
}

export function FileManagement({
  resumeId,
  resumeTitle, // eslint-disable-line @typescript-eslint/no-unused-vars -- kept for API stability
  filePath,
  onFileDeleted,
}: FileManagementProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const hasFile = !!filePath;

  // Derive display filename from storage path
  const displayFileName = filePath
    ? extractDisplayFileName(filePath)
    : null;

  const handleOpen = useCallback(async () => {
    try {
      const result = await getResumeFileUrlAction(resumeId);
      if (result.success) {
        const { url } = result.data as { url: string };
        window.open(url, "_blank");
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch {
      setToast({ message: "Failed to open file", type: "error" });
    }
  }, [resumeId]);

  const handleDownload = useCallback(async () => {
    try {
      const result = await getResumeFileUrlAction(resumeId);
      if (result.success) {
        const { url } = result.data as { url: string };
        const link = document.createElement("a");
        link.href = url;
        // Use extractDisplayFileName result, or a neutral fallback that
        // does not claim a wrong extension for DOCX files.
        link.download = displayFileName ?? "resume-file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch {
      setToast({ message: "Failed to download file", type: "error" });
    }
  }, [resumeId, displayFileName]);

  const handleDelete = useCallback(async () => {
    setConfirmOpen(false);
    setIsDeleting(true);

    try {
      const result = await deleteResumeFileAction(resumeId);
      if (result.success) {
        setToast({ message: "File deleted successfully", type: "success" });
        onFileDeleted?.();
      } else {
        setToast({ message: result.error, type: "error" });
      }
    } catch {
      setToast({ message: "Failed to delete file", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  }, [resumeId, onFileDeleted]);

  if (!hasFile) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <FileText className="h-3.5 w-3.5" />
        <span>No file attached</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-blue-600">
          <FileText className="h-3.5 w-3.5" />
          <span className="font-medium">File attached</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleOpen}
            disabled={isDeleting}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50"
            aria-label={displayFileName ? `Open ${displayFileName}` : "Open file"}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDeleting}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50"
            aria-label={displayFileName ? `Download ${displayFileName}` : "Download file"}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={displayFileName ? `Delete ${displayFileName}` : "Delete file"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete uploaded file?"
        description="This removes the uploaded file from this resume. The resume itself will not be deleted."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
