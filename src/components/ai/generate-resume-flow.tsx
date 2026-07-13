"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2 } from "lucide-react";
import { GenerateResumeForm } from "./generate-resume-form";
import { GenerateResumePreview } from "./generate-resume-preview";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  generateResumeAction,
  createResumeWithSnapshotAction,
} from "@/app/resumes/actions";
import type { GenerateResumeInput } from "@/lib/ai/types";
import type { ResumeSnapshot } from "@/types/resume";
import { normalizeSnapshotSkills } from "@/lib/skills-normalize";
import { normalizeSnapshotTemplate } from "@/lib/templates";
import { normalizeSnapshotDates } from "@/lib/date-normalize";

// ─────────────────────────────────────────────────────────────
// AI Generation Flow
// ─────────────────────────────────────────────────────────────
// Slide-over panel that orchestrates the full AI resume
// generation journey: form → loading → preview → apply.
//
// Two modes:
//  - new: creates a resume + version, redirects to builder
//  - existing: replaces builder snapshot (caller handles dirty)
// ─────────────────────────────────────────────────────────────

type FlowStep = "form" | "loading" | "preview";

interface GenerateResumeFlowProps {
  open: boolean;
  onClose: () => void;
  /** Mode determines apply behavior */
  mode: "new" | "existing";
  /** Pre-filled target role (e.g. from resume or profile) */
  initialTargetRole?: string;
  /** Pre-filled resume title (for new mode) */
  initialTitle?: string;
  /** Called when snapshot is accepted in "existing" mode */
  onApplySnapshot?: (snapshot: ResumeSnapshot) => void;
  /** Ref to return focus to after closing */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function GenerateResumeFlow({
  open,
  onClose,
  mode,
  initialTargetRole = "",
  initialTitle = "",
  onApplySnapshot,
  triggerRef,
}: GenerateResumeFlowProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<FlowStep>("form");
  const [formInput, setFormInput] = useState<GenerateResumeInput | null>(null);
  const [snapshot, setSnapshot] = useState<ResumeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Focus management
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
    if (!open && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [open, triggerRef]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      // Delay reset to allow exit animation
      const timer = setTimeout(() => {
        setStep("form");
        setFormInput(null);
        setSnapshot(null);
        setError(null);
        setApplying(false);
        setConfirmOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ── Generate handler ──────────────────────────────────────

  const handleGenerate = useCallback(
    async (input: GenerateResumeInput) => {
      setFormInput(input);
      setStep("loading");
      setError(null);

      try {
        const result = await generateResumeAction(input);

        if (!result.success) {
          setError(result.error.message);
          setStep("form");
          return;
        }

        // Normalize the generated snapshot
        let normalized = result.data.snapshot;
        normalized = normalizeSnapshotSkills(normalized);
        normalized = normalizeSnapshotTemplate(normalized);
        normalized = normalizeSnapshotDates(normalized);

        setSnapshot(normalized);
        setStep("preview");
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setStep("form");
      }
    },
    [],
  );

  // ── Regenerate handler ────────────────────────────────────

  const handleRegenerate = useCallback(() => {
    if (formInput) {
      handleGenerate(formInput);
    }
  }, [formInput, handleGenerate]);

  // ── Edit inputs handler ───────────────────────────────────

  const handleEditInputs = useCallback(() => {
    setStep("form");
    setError(null);
  }, []);

  // ── Accept handler ────────────────────────────────────────

  const handleAccept = useCallback(async () => {
    if (!snapshot) return;

    if (mode === "existing" && onApplySnapshot) {
      // In existing mode, open confirmation before applying
      setConfirmOpen(true);
      return;
    }

    // New resume mode: create resume + version
    setApplying(true);
    try {
      const title = formInput?.targetRole || initialTitle || "AI Generated Resume";
      const result = await createResumeWithSnapshotAction(
        title,
        snapshot,
        formInput?.targetRole || null,
      );

      if (!result.success) {
        setError(result.error);
        setApplying(false);
        return;
      }

      // Success — redirect to builder
      router.push(`/resumes/${result.resumeId}/edit`);
      onClose();
    } catch {
      setError("Failed to create resume. Please try again.");
      setApplying(false);
    }
  }, [
    snapshot,
    mode,
    onApplySnapshot,
    formInput,
    initialTitle,
    router,
    onClose,
  ]);

  // ── Confirm apply handler ────────────────────────────────

  const handleConfirmApply = useCallback(() => {
    if (!snapshot || !onApplySnapshot) return;
    setConfirmOpen(false);
    onApplySnapshot(snapshot);
    onClose();
  }, [snapshot, onApplySnapshot, onClose]);

  // ── Cancel confirm handler ───────────────────────────────

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  if (!open) return null;

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
        aria-label="AI resume generation"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform sm:max-w-xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {step === "preview" ? "Review Generated Resume" : "Generate Resume with AI"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Loading state */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16" role="status">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Generating your resume...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This may take a few moments
              </p>
              <span className="sr-only">Loading, please wait</span>
            </div>
          )}

          {/* Form step */}
          {step === "form" && (
            <GenerateResumeForm
              onSubmit={handleGenerate}
              loading={false}
              error={error}
              initialTargetRole={initialTargetRole}
              showTitleField={mode === "new"}
            />
          )}

          {/* Preview step */}
          {step === "preview" && snapshot && (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              <GenerateResumePreview
                snapshot={snapshot}
                onAccept={handleAccept}
                onRegenerate={handleRegenerate}
                onEditInputs={handleEditInputs}
                loading={applying}
                acceptLabel={
                  mode === "new" ? "Create Resume" : "Apply to Builder"
                }
              />
            </>
          )}
        </div>

        {/* Applying overlay */}
        {applying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="mt-3 text-sm text-slate-600">Creating resume...</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog for existing mode */}
      <ConfirmDialog
        open={confirmOpen}
        title="Replace current draft?"
        description="This will replace your current unsaved edits. Continue?"
        confirmLabel="Apply to Builder"
        cancelLabel="Keep Current"
        variant="primary"
        onConfirm={handleConfirmApply}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}
