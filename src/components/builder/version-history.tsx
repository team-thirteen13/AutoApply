"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type RefObject,
} from "react";
import { X, Loader2, AlertCircle, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResumePreview } from "@/components/preview/resume-preview";
import {
  listVersionsAction,
  restoreVersionAction,
} from "@/app/resumes/actions";
import { normalizeSkills } from "@/lib/skills-normalize";
import { normalizeSnapshotTemplate } from "@/lib/templates";
import { VersionHistoryItem } from "./version-history-item";
import type { ResumeVersion, ResumeSnapshot } from "@/types/resume";

interface VersionHistoryProps {
  open: boolean;
  resumeId: string;
  onClose: () => void;
  onRestore: (snapshot: ResumeSnapshot) => void;
  historyButtonRef?: RefObject<HTMLButtonElement | null>;
}

function normalizeSnapshot(snapshot: ResumeSnapshot): ResumeSnapshot {
  let normalized = snapshot;
  if (normalized.skills) {
    normalized = { ...normalized, skills: normalizeSkills(normalized.skills) };
  }
  normalized = normalizeSnapshotTemplate(normalized);
  return normalized;
}

/** Extracted to avoid TypeScript narrowing issues with server action types */
function VersionList({
  versions,
  latestVersionId,
  selectedVersionId,
  onPreview,
  onRestore,
}: {
  versions: ResumeVersion[];
  latestVersionId: string | null;
  selectedVersionId: string | null;
  onPreview: (version: ResumeVersion) => void;
  onRestore: (version: ResumeVersion) => void;
}) {
  return (
    <ul className="space-y-3" role="list">
      {versions.map((v) => (
        <VersionHistoryItem
          key={v.id}
          version={v}
          isLatest={v.id === latestVersionId}
          isSelected={selectedVersionId === v.id}
          onPreview={onPreview}
          onRestore={onRestore}
        />
      ))}
    </ul>
  );
}

export function VersionHistory({
  open,
  resumeId,
  onClose,
  onRestore,
  historyButtonRef,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] =
    useState<ResumeVersion | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<ResumeVersion | null>(
    null,
  );
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch versions when panel opens
  const fetchVersions = useCallback(async () => {
    if (!open) return;

    setIsLoading(true);
    setError(null);
    setSelectedVersion(null);

    try {
      const result = await listVersionsAction(resumeId);
      if (result.success) {
        // Cast through unknown to avoid server-action type inference issue
        const fetched = JSON.parse(
          JSON.stringify(result.data),
        ) as ResumeVersion[];
        setVersions(fetched);
      } else {
        setError(
          result.error?.message ?? "Failed to load version history",
        );
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [open, resumeId]);

  // Fetch versions when panel opens
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on panel open
    void fetchVersions();
  }, [open, fetchVersions]);

  // Focus the panel when it opens; return focus to History button when it closes
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
    if (!open && historyButtonRef?.current) {
      historyButtonRef.current.focus();
    }
  }, [open, historyButtonRef]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handlePreview = useCallback((version: ResumeVersion) => {
    setSelectedVersion((prev) =>
      prev?.id === version.id ? null : version,
    );
  }, []);

  const handleRestoreInit = useCallback(
    (version: ResumeVersion) => {
      setRestoreTarget(version);
      setConfirmOpen(true);
    },
    [],
  );

  const handleConfirmRestore = useCallback(async () => {
    if (!restoreTarget) return;

    setIsRestoring(true);
    try {
      const result = await restoreVersionAction(resumeId, restoreTarget.id);
      if (result.success) {
        const restored = normalizeSnapshot(result.data.snapshot);
        onRestore(restored);
        setConfirmOpen(false);
        setRestoreTarget(null);
        setSelectedVersion(null);
        await fetchVersions();
      } else {
        setError(
          result.error?.message ?? "Failed to restore version",
        );
      }
    } catch {
      setError("An unexpected error occurred during restore");
    } finally {
      setIsRestoring(false);
    }
  }, [restoreTarget, resumeId, onRestore, fetchVersions]);

  const handleCancelRestore = useCallback(() => {
    setConfirmOpen(false);
    setRestoreTarget(null);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedVersion(null);
  }, []);

  if (!open) return null;

  const latestVersion: ResumeVersion | undefined = versions[0];
  const latestVersionId = latestVersion?.id ?? null;
  const selectedVersionId: string | null = selectedVersion?.id ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Version history"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform sm:max-w-xl outline-none"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-slate-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Version History
              </h2>
              {!isLoading && (
                <p className="text-xs text-slate-400">
                  {versions.length} version{versions.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close version history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">
          {selectedVersion ? (
            /* Preview mode */
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedVersion.label || "Saved version"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Previewing historical version
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePreview}
                  aria-label="Return to version list"
                >
                  ← Back to list
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <ResumePreview
                    snapshot={normalizeSnapshot(selectedVersion.snapshot)}
                  />
                </div>
              </div>

              {selectedVersion.id !== latestVersionId && (
                <div className="border-t border-slate-200 px-6 py-4">
                  <Button
                    variant="gradient"
                    onClick={() => handleRestoreInit(selectedVersion)}
                    disabled={isRestoring}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore this version
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* List mode */
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  <p className="mt-3 text-sm text-slate-400">
                    Loading versions...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16" role="alert">
                  <AlertCircle className="h-8 w-8 text-red-300" />
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchVersions}
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <History className="h-12 w-12 text-slate-200" />
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    No versions yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Save your resume to create the first version.
                  </p>
                </div>
              ) : (
                <VersionList
                  versions={versions}
                  latestVersionId={latestVersionId}
                  selectedVersionId={selectedVersionId}
                  onPreview={handlePreview}
                  onRestore={handleRestoreInit}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Restore confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Restore Version"
        description={
          restoreTarget
            ? `This will create a new version using the snapshot from "${restoreTarget.label || "Saved version"}". Your current unsaved edits (if any) will be replaced.`
            : ""
        }
        confirmLabel={isRestoring ? "Restoring..." : "Restore"}
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
      />
    </>
  );
}
