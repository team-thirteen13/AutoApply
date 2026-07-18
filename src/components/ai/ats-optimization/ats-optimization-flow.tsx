"use client";

// ─────────────────────────────────────────────────────────────
// ATS Resume Optimization Flow
// ─────────────────────────────────────────────────────────────
// Slide-over panel implementing the full ATS optimization journey:
// Upload → Review parsed → Target job → Optimize → Compare → Confirm → Builder
//
// Uses MockResumeOptimizationProvider in test mode.
// Server actions handle authentication and provider details.
// ─────────────────────────────────────────────────────────────

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import {
  optimizeResumeAction,
  checkOptimizationAvailability,
  type OptimizeResumeActionResult,
} from "@/features/ats-optimization";
import { parseResumeFileAction } from "@/app/resumes/actions";
import { createResumeWithSnapshotAction } from "@/app/resumes/actions";
import type { ResumeSnapshot } from "@/types/resume";
import type { OptimizationChange } from "@/lib/ai/optimization/types";
import { normalizeSnapshotSkills } from "@/lib/skills-normalize";
import { normalizeSnapshotTemplate } from "@/lib/templates";
import { normalizeSnapshotDates } from "@/lib/date-normalize";

// ── Types ────────────────────────────────────────────────────

type FlowStep =
  | "upload"
  | "review-parsed"
  | "target-job"
  | "optimizing"
  | "comparing"
  | "confirming";

interface AtsOptimizationFlowProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

// ── File Validation ──────────────────────────────────────────

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = ".pdf,.docx";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || ext === "docx") {
      // MIME type might be wrong but extension is correct
      return { valid: true };
    }
    return {
      valid: false,
      error:
        "Unsupported file type. Please upload a PDF or DOCX file.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File exceeds the maximum size of 10 MB.",
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true };
}

// ── Format File Size ─────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Parser Error Messages ────────────────────────────────────

const PARSER_ERROR_MESSAGES: Record<string, string> = {
  unsupported_file_type:
    "Unsupported file type. Please upload a PDF or DOCX file.",
  scanned_pdf:
    "This appears to be a scanned PDF. Please upload a text-based PDF or a DOCX file.",
  malformed_document:
    "The file could not be parsed. It may be corrupted or in an unsupported format.",
  empty_document:
    "The file is empty. Please upload a valid resume document.",
  extraction_failed:
    "Failed to extract content from the file. Please try a different document.",
  file_too_large: "File exceeds the maximum size of 10 MB.",
  authentication_required: "You must be signed in to parse a resume.",
};

// ── Loading Messages ─────────────────────────────────────────

const OPTIMIZING_MESSAGES = [
  "Preparing resume...",
  "Analyzing target role...",
  "Rewriting for ATS compatibility...",
  "Validating factual accuracy...",
];

// ── Main Component ───────────────────────────────────────────

export function AtsOptimizationFlow({
  open,
  onClose,
  triggerRef,
}: AtsOptimizationFlowProps) {
  const router = useRouter();
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────

  const [step, setStep] = useState<FlowStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedWarnings, setParsedWarnings] = useState<string[]>([]);
  const [editedSnapshot, setEditedSnapshot] =
    useState<ResumeSnapshot | null>(null);
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizeResumeActionResult | null>(null);
  const [acceptedChanges, setAcceptedChanges] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);
  const [resumeTitle, setResumeTitle] = useState("");

  // ── Focus Trap ─────────────────────────────────────────────

  const panelRef = useFocusTrap<HTMLDivElement>(open, triggerRef, {
    ignoreEscape: confirmOpen || loading,
    headingRef,
  });

  // ── Close Handler ──────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (step !== "upload" && editedSnapshot) {
      setConfirmOpen(true);
      return;
    }
    onClose();
  }, [step, editedSnapshot, onClose]);

  // ── Escape Handler ─────────────────────────────────────────

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;
    const handler = () => {
      if (!confirmOpen && !loading) handleClose();
    };
    el.addEventListener("focus-trap-escape", handler);
    return () => el.removeEventListener("focus-trap-escape", handler);
  }, [open, confirmOpen, loading, handleClose]);

  // ── Check Availability ─────────────────────────────────────

  useEffect(() => {
    if (open) {
      checkOptimizationAvailability().then(setAvailability);
    }
  }, [open]);

  // ── Reset on Close ─────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep("upload");
        setFile(null);
        setParsedWarnings([]);
        setEditedSnapshot(null);
        setTargetJobTitle("");
        setTargetJobDescription("");
        setOptimizationResult(null);
        setAcceptedChanges(new Set());
        setError(null);
        setLoading(false);
        setLoadingMessage("");
        setConfirmOpen(false);
        setToast(null);
        setResumeTitle("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ── File Selection ─────────────────────────────────────────

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error!);
        return;
      }

      setFile(selectedFile);
      setError(null);
    },
    [],
  );

  // ── Upload and Parse ───────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setLoadingMessage("Parsing resume...");
    setError(null);

    try {
      const result = await parseResumeFileAction(file);

      if (!result.success) {
        const message =
          PARSER_ERROR_MESSAGES[result.code] ||
          "Failed to parse the resume. Please try a different file.";
        setError(message);
        setLoading(false);
        return;
      }

      setParsedWarnings(result.data.warnings);
      setEditedSnapshot(result.data.snapshot);
      setResumeTitle(
        result.data.snapshot.profile?.name
          ? `${result.data.snapshot.profile.name} - ATS Optimized`
          : "ATS Optimized Resume",
      );
      setStep("review-parsed");
    } catch {
      setError("An unexpected error occurred while parsing. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file]);

  // ── Update Parsed Field ────────────────────────────────────

  const handleUpdateField = useCallback(
    (path: string, value: string) => {
      if (!editedSnapshot) return;

      const newSnapshot = { ...editedSnapshot };
      const parts = path.split(".");

      // Simple depth-2 path handling (e.g., "profile.name", "summary")
      if (parts.length === 2) {
        const [section, field] = parts;
        if (section === "profile" && newSnapshot.profile) {
          newSnapshot.profile = {
            ...newSnapshot.profile,
            [field]: value,
          };
        }
      } else if (parts.length === 1) {
        // Top-level field (e.g., "summary")
        (newSnapshot as Record<string, unknown>)[parts[0]] = value;
      }

      setEditedSnapshot(newSnapshot);
    },
    [editedSnapshot],
  );

  // ── Update Collection Item ─────────────────────────────────

  const handleUpdateCollectionItem = useCallback(
    (
      collection: keyof ResumeSnapshot,
      index: number,
      field: string,
      value: string,
    ) => {
      if (!editedSnapshot) return;

      const items = editedSnapshot[collection] as
        | Array<Record<string, unknown>>
        | undefined;
      if (!items || !items[index]) return;

      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };

      setEditedSnapshot({
        ...editedSnapshot,
        [collection]: newItems,
      });
    },
    [editedSnapshot],
  );

  // ── Add Collection Item ────────────────────────────────────

  const handleAddItem = useCallback(
    (collection: keyof ResumeSnapshot) => {
      if (!editedSnapshot) return;

      const items = (editedSnapshot[collection] as unknown[]) || [];

      let newItem: Record<string, unknown>;
      switch (collection) {
        case "experiences":
          newItem = {
            id: crypto.randomUUID(),
            company: "",
            title: "",
            startDate: "",
            endDate: null,
          };
          break;
        case "education":
          newItem = {
            id: crypto.randomUUID(),
            university: "",
            degree: "",
            startDate: "",
            endDate: null,
          };
          break;
        case "projects":
          newItem = {
            id: crypto.randomUUID(),
            title: "",
            description: "",
          };
          break;
        case "certificates":
          newItem = {
            id: crypto.randomUUID(),
            name: "",
            startDate: "",
          };
          break;
        case "skills":
          newItem = {
            id: crypto.randomUUID(),
            name: "",
            category: "",
            proficiency: "",
          };
          break;
        case "languages":
          newItem = {
            id: crypto.randomUUID(),
            name: "",
            proficiency: "",
          };
          break;
        default:
          return;
      }

      setEditedSnapshot({
        ...editedSnapshot,
        [collection]: [...items, newItem],
      });
    },
    [editedSnapshot],
  );

  // ── Remove Collection Item ─────────────────────────────────

  const handleRemoveItem = useCallback(
    (collection: keyof ResumeSnapshot, index: number) => {
      if (!editedSnapshot) return;

      const items = editedSnapshot[collection] as unknown[];
      if (!items) return;

      setEditedSnapshot({
        ...editedSnapshot,
        [collection]: items.filter((_, i) => i !== index),
      });
    },
    [editedSnapshot],
  );

  // ── Run Optimization ───────────────────────────────────────

  const handleOptimize = useCallback(async () => {
    if (!editedSnapshot) return;

    setLoading(true);
    setError(null);

    // Cycle through loading messages
    let messageIndex = 0;
    setLoadingMessage(OPTIMIZING_MESSAGES[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % OPTIMIZING_MESSAGES.length;
      setLoadingMessage(OPTIMIZING_MESSAGES[messageIndex]);
    }, 3000);

    try {
      const result = await optimizeResumeAction({
        resume: editedSnapshot,
        targetJobTitle: targetJobTitle.trim() || undefined,
        targetJobDescription: targetJobDescription.trim() || undefined,
      });

      setOptimizationResult(result);

      if (result.success) {
        // Initialize all changes as accepted
        setAcceptedChanges(
          new Set(result.data.changes.map((_, i) => i)),
        );
        setStep("comparing");
      } else {
        setError(result.error);
        setStep("target-job");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStep("target-job");
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
    }
  }, [editedSnapshot, targetJobTitle, targetJobDescription]);

  // ── Toggle Change Acceptance ───────────────────────────────

  const handleToggleChange = useCallback(
    (index: number) => {
      setAcceptedChanges((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    [],
  );

  // ── Accept/Reject All ──────────────────────────────────────

  const handleAcceptAll = useCallback(() => {
    if (!optimizationResult?.success) return;
    setAcceptedChanges(
      new Set(optimizationResult.data.changes.map((_, i) => i)),
    );
  }, [optimizationResult]);

  const handleRejectAll = useCallback(() => {
    setAcceptedChanges(new Set());
  }, []);

  // ── Build Final Snapshot ───────────────────────────────────

  const finalSnapshot = useMemo(() => {
    if (!optimizationResult?.success || !editedSnapshot) return null;

    // Use optimized resume as the base — it contains all changes
    const optimized = optimizationResult.data.optimizedResume;
    const changes = optimizationResult.data.changes;

    // Start from the source snapshot
    const result = { ...editedSnapshot };

    // For each collection field, decide per-item whether to use
    // the optimized version (accepted) or the source version (rejected).
    const COLLECTION_SECTIONS = [
      "experiences",
      "education",
      "projects",
      "certificates",
      "skills",
      "languages",
    ] as const;

    for (const section of COLLECTION_SECTIONS) {
      const sourceItems = result[section];
      const optimizedItems = optimized[section];
      if (!Array.isArray(sourceItems) || !Array.isArray(optimizedItems)) continue;

      // Determine which items have accepted changes
      const acceptedIndices = new Set<number>();
      const rejectedIndices = new Set<number>();

      for (let ci = 0; ci < changes.length; ci++) {
        if (changes[ci].section !== section) continue;
        if (!acceptedChanges.has(ci)) {
          rejectedIndices.add(ci);
        } else {
          acceptedIndices.add(ci);
        }
      }

      // If all changes for this section are accepted, use the optimized collection
      if (acceptedIndices.size > 0 && rejectedIndices.size === 0) {
        (result as Record<string, unknown>)[section] = optimizedItems;
        continue;
      }

      // If all changes for this section are rejected, keep the source
      if (rejectedIndices.size > 0 && acceptedIndices.size === 0) {
        continue;
      }

      // Mixed: apply per-item from optimized where accepted, source where rejected
      // Match by ID or index position
      const resultItems = sourceItems.map((sourceItem, idx) => {
        const optimizedItem = optimizedItems[idx];
        if (!optimizedItem) return sourceItem;

        // Check if any accepted change targets this item's index
        const hasAcceptedChange = Array.from(acceptedIndices).some((ci) => {
          const change = changes[ci];
          // Match by field containing the item identifier
          if (change.field) {
            const itemIdentifier =
              "company" in sourceItem
                ? `${(sourceItem as { company: string }).company}/${(sourceItem as { title: string }).title}`
                : "name" in sourceItem
                  ? (sourceItem as { name: string }).name
                  : "university" in sourceItem
                    ? (sourceItem as { university: string }).university
                    : "title" in sourceItem
                      ? (sourceItem as { title: string }).title
                      : "";
            return change.field.includes(itemIdentifier);
          }
          return false;
        });

        return hasAcceptedChange ? optimizedItem : sourceItem;
      });

      (result as Record<string, unknown>)[section] = resultItems;
    }

    // Handle top-level fields (summary)
    for (let ci = 0; ci < changes.length; ci++) {
      const change = changes[ci];
      if (!acceptedChanges.has(ci)) continue;

      if (change.section === "summary" && change.field === "summary") {
        result.summary = optimized.summary;
      }
    }

    return result;
  }, [optimizationResult, editedSnapshot, acceptedChanges]);

  // ── Create Resume ──────────────────────────────────────────

  const handleCreateResume = useCallback(async () => {
    if (!finalSnapshot) return;

    setLoading(true);
    setError(null);

    try {
      // Normalize the snapshot
      let normalized = finalSnapshot;
      normalized = normalizeSnapshotSkills(normalized);
      normalized = normalizeSnapshotTemplate(normalized);
      normalized = normalizeSnapshotDates(normalized);

      const result = await createResumeWithSnapshotAction(
        resumeTitle.trim() || "ATS Optimized Resume",
        normalized,
        targetJobTitle.trim() || null,
        "ATS Optimized",
      );

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success - redirect to builder
      router.push(`/resumes/${result.resumeId}/edit`);
      onClose();
    } catch {
      setError("Failed to create resume. Please try again.");
      setLoading(false);
    }
  }, [
    finalSnapshot,
    resumeTitle,
    targetJobTitle,
    router,
    onClose,
  ]);

  // ── Retry Optimization ─────────────────────────────────────

  const handleRetry = useCallback(() => {
    setError(null);
    setOptimizationResult(null);
    setAcceptedChanges(new Set());
    setStep("target-job");
  }, []);

  // ── Render Helpers ─────────────────────────────────────────

  const renderStepIndicator = () => {
    const steps: { key: FlowStep; label: string }[] = [
      { key: "upload", label: "Upload" },
      { key: "review-parsed", label: "Review" },
      { key: "target-job", label: "Target" },
      { key: "optimizing", label: "Optimize" },
      { key: "comparing", label: "Compare" },
      { key: "confirming", label: "Confirm" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${
                i < currentIndex
                  ? "bg-emerald-100 text-emerald-700"
                  : i === currentIndex
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < currentIndex ? (
                <Check className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={
                i === currentIndex ? "font-medium text-slate-700" : ""
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-4 border-t border-slate-200" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50">
          <Upload className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Upload your resume
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          PDF or DOCX, max 10 MB
        </p>
      </div>

      {/* File input */}
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/30">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload resume file"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Choose a file
        </button>
        <p className="mt-1 text-xs text-slate-400">
          or drag and drop
        </p>
      </div>

      {/* Selected file */}
      {file && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-400">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setError(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="rounded p-1 text-slate-400 hover:text-slate-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Parse button */}
      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        loading={loading}
        className="w-full"
      >
        {loading ? loadingMessage : "Parse Resume"}
      </Button>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );

  const renderReviewParsedStep = () => {
    if (!editedSnapshot) return null;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Review extracted content
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Correct any parsing errors before optimization
          </p>
        </div>

        {/* Warnings */}
        {parsedWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700">
                {parsedWarnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="mb-3 font-medium text-slate-700">Profile</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Name">
              <Input
                value={editedSnapshot.profile?.name || ""}
                onChange={(e) =>
                  handleUpdateField("profile.name", e.target.value)
                }
                placeholder="Full name"
              />
            </FormField>
            <FormField label="Title">
              <Input
                value={editedSnapshot.profile?.title || ""}
                onChange={(e) =>
                  handleUpdateField("profile.title", e.target.value)
                }
                placeholder="Job title"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={editedSnapshot.profile?.email || ""}
                onChange={(e) =>
                  handleUpdateField("profile.email", e.target.value)
                }
                placeholder="email@example.com"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={editedSnapshot.profile?.phone || ""}
                onChange={(e) =>
                  handleUpdateField("profile.phone", e.target.value)
                }
                placeholder="Phone number"
              />
            </FormField>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="mb-3 font-medium text-slate-700">Summary</h4>
          <Textarea
            value={editedSnapshot.summary || ""}
            onChange={(e) => handleUpdateField("summary", e.target.value)}
            placeholder="Professional summary"
            rows={4}
          />
        </div>

        {/* Experiences */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Experience</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("experiences")}
            >
              + Add
            </Button>
          </div>
          {editedSnapshot.experiences?.map((exp, i) => (
            <div
              key={exp.id || i}
              className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Experience {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem("experiences", i)}
                  className="rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label={`Remove experience ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={exp.company}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "experiences",
                      i,
                      "company",
                      e.target.value,
                    )
                  }
                  placeholder="Company"
                />
                <Input
                  value={exp.title}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "experiences",
                      i,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Title"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Skills</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("skills")}
            >
              + Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {editedSnapshot.skills?.map((skill, i) => (
              <div
                key={skill.id || i}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1"
              >
                <Input
                  value={skill.name}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "skills",
                      i,
                      "name",
                      e.target.value,
                    )
                  }
                  className="h-6 w-24 border-0 bg-transparent p-0 text-sm"
                  placeholder="Skill"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem("skills", i)}
                  className="rounded text-slate-400 hover:text-red-500"
                  aria-label={`Remove skill ${skill.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Education</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("education")}
            >
              + Add
            </Button>
          </div>
          {editedSnapshot.education?.map((edu, i) => (
            <div
              key={edu.id || i}
              className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Education {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem("education", i)}
                  className="rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label={`Remove education ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={edu.university}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "education",
                      i,
                      "university",
                      e.target.value,
                    )
                  }
                  placeholder="University"
                />
                <Input
                  value={edu.degree}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "education",
                      i,
                      "degree",
                      e.target.value,
                    )
                  }
                  placeholder="Degree"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Projects</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("projects")}
            >
              + Add
            </Button>
          </div>
          {editedSnapshot.projects?.map((project, i) => (
            <div
              key={project.id || i}
              className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Project {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem("projects", i)}
                  className="rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label={`Remove project ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={project.title}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "projects",
                      i,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Title"
                />
                <Input
                  value={project.description || ""}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "projects",
                      i,
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Description"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Certifications</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("certificates")}
            >
              + Add
            </Button>
          </div>
          {editedSnapshot.certificates?.map((cert, i) => (
            <div
              key={cert.id || i}
              className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Certification {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem("certificates", i)}
                  className="rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label={`Remove certification ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={cert.name}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "certificates",
                      i,
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Certification name"
                />
                <Input
                  value={cert.issuingOrganisation || ""}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "certificates",
                      i,
                      "issuingOrganisation",
                      e.target.value,
                    )
                  }
                  placeholder="Issuing organization"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Languages</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem("languages")}
            >
              + Add
            </Button>
          </div>
          {editedSnapshot.languages?.map((lang, i) => (
            <div
              key={lang.id || i}
              className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Language {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem("languages", i)}
                  className="rounded p-1 text-slate-400 hover:text-red-500"
                  aria-label={`Remove language ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={lang.name}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "languages",
                      i,
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Language"
                />
                <Input
                  value={lang.proficiency || ""}
                  onChange={(e) =>
                    handleUpdateCollectionItem(
                      "languages",
                      i,
                      "proficiency",
                      e.target.value,
                    )
                  }
                  placeholder="Proficiency"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep("upload")}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setStep("target-job")} className="flex-1">
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderTargetJobStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Target job information
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Optional — helps align keywords with the target role
        </p>
      </div>

      <FormField
        label="Target job title"
        hint="e.g. Senior Software Engineer"
      >
        <Input
          value={targetJobTitle}
          onChange={(e) => setTargetJobTitle(e.target.value)}
          placeholder="Job title"
          maxLength={200}
        />
      </FormField>

      <FormField
        label="Job description"
        hint="Paste the job description for keyword alignment. Your resume will not be modified to include unsupported qualifications."
      >
        <Textarea
          value={targetJobDescription}
          onChange={(e) => setTargetJobDescription(e.target.value)}
          placeholder="Paste job description here..."
          rows={8}
          maxLength={10000}
        />
      </FormField>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setStep("review-parsed")}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleOptimize} className="flex-1">
          <Wand2 className="h-4 w-4" />
          Optimize
        </Button>
      </div>
    </div>
  );

  const renderOptimizingStep = () => (
    <div className="flex flex-col items-center justify-center py-16" role="status">
      <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      <p className="mt-4 text-sm font-medium text-slate-700">
        {loadingMessage}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        This may take a few moments
      </p>
      <span className="sr-only">Optimizing resume, please wait</span>
    </div>
  );

  const renderComparingStep = () => {
    if (!optimizationResult?.success) return null;

    const { changes } = optimizationResult.data;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Review changes
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Accept or reject individual changes
          </p>
        </div>

        {/* Accept/Reject All */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleAcceptAll}>
            Accept All
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRejectAll}>
            Reject All
          </Button>
          <span className="ml-auto text-xs text-slate-500">
            {acceptedChanges.size} of {changes.length} accepted
          </span>
        </div>

        {/* Changes list */}
        <div className="space-y-3">
          {changes.map((change, i) => (
            <ChangeCard
              key={i}
              change={change}
              accepted={acceptedChanges.has(i)}
              onToggle={() => handleToggleChange(i)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleRetry}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            onClick={() => setStep("confirming")}
            disabled={acceptedChanges.size === 0}
            className="flex-1"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmingStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Create optimized resume
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Review and confirm to create your ATS-optimized resume
        </p>
      </div>

      <FormField label="Resume title">
        <Input
          value={resumeTitle}
          onChange={(e) => setResumeTitle(e.target.value)}
          placeholder="Resume title"
          maxLength={200}
        />
      </FormField>

      {/* Summary of changes */}
      <div className="rounded-xl border border-slate-200 p-4">
        <h4 className="mb-2 font-medium text-slate-700">
          Changes to be applied
        </h4>
        <ul className="space-y-1 text-sm text-slate-600">
          {optimizationResult?.success &&
            optimizationResult.data.changes
              .filter((_, i) => acceptedChanges.has(i))
              .map((change, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>
                    {change.section}: {change.reason.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setStep("comparing")}
          className="flex-1"
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleCreateResume}
          disabled={loading || !resumeTitle.trim()}
          loading={loading}
          className="flex-1"
        >
          Create Resume
        </Button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────

  if (!open) return null;

  // Unavailable state
  if (availability && !availability.available) {
    return (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl outline-none"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 id={titleId} ref={headingRef} className="text-lg font-semibold text-slate-900" tabIndex={-1}>
              ATS Optimization
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              Optimization unavailable
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Resume optimization is currently not configured. Please contact support.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform sm:max-w-xl outline-none"
      >
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-violet-600" />
              <h2
                id={titleId}
                ref={headingRef}
                className="text-lg font-semibold text-slate-900"
                tabIndex={-1}
              >
                ATS Optimization
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3">{renderStepIndicator()}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "upload" && renderUploadStep()}
          {step === "review-parsed" && renderReviewParsedStep()}
          {step === "target-job" && renderTargetJobStep()}
          {(step === "optimizing" || loading) && renderOptimizingStep()}
          {step === "comparing" && renderComparingStep()}
          {step === "confirming" && renderConfirmingStep()}
        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Discard changes?"
        description="You have unsaved changes that will be lost. Are you sure you want to close?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Toast */}
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

// ── Change Card Component ────────────────────────────────────

interface ChangeCardProps {
  change: OptimizationChange;
  accepted: boolean;
  onToggle: () => void;
}

function ChangeCard({ change, accepted, onToggle }: ChangeCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        accepted
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {change.section} • {change.reason.replace(/_/g, " ")}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            accepted
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          aria-label={accepted ? "Reject change" : "Accept change"}
        >
          {accepted ? "Accepted" : "Reject"}
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-medium uppercase text-slate-400">
            Original
          </p>
          <p className="text-sm text-slate-600 line-through">
            {change.originalValue}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase text-slate-400">
            Optimized
          </p>
          <p className="text-sm text-slate-700">{change.optimizedValue}</p>
        </div>
      </div>
    </div>
  );
}
