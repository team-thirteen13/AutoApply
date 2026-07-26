"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Printer, Download } from "lucide-react";
import type { ResumeSnapshot } from "@/types/resume";
import { getResumeAction } from "../../actions";
import { ResumePreview } from "@/components/preview/resume-preview";
import { normalizeSnapshotSkills } from "@/lib/skills-normalize";
import { normalizeSnapshotTemplate } from "@/lib/templates";

// ─────────────────────────────────────────────────────────────
// Resume Preview Page
// ─────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [snapshot, setSnapshot] = useState<ResumeSnapshot | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function load() {
      try {
        const result = await getResumeAction(id);
        if (result.success) {
          const versions = result.data.versions;
          const latestVersion = versions[0];
          setSnapshot(
            normalizeSnapshotTemplate(
              normalizeSnapshotSkills(latestVersion?.snapshot ?? {}),
            ),
          );
          setTitle(result.data.resume.title);
        } else {
          setError(result.error?.message ?? "Failed to load resume");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }, []);

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 print-bg-hide">
      {/* Header — hidden during print */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/resumes/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Resume content — print-constrained container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:px-0 print:py-0">
        <div className="print-resume-container">
          <ResumePreview snapshot={snapshot ?? {}} />
        </div>
      </main>

      {/* Print-only fallback hint — shown in print output if needed */}
      <div className="print-only text-center text-xs text-slate-500 pt-2">
        Exported from AutoApply
      </div>
    </div>
  );
}
