"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Printer, Download } from "lucide-react";
import type { ResumeSnapshot } from "@/types/resume";
import { getResumeAction } from "../../actions";
import { ResumePreview } from "@/components/preview/resume-preview";

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
          setSnapshot(latestVersion?.snapshot ?? {});
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header */}
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
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              disabled
              title="PDF export coming soon"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              PDF
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                Soon
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Preview */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:px-0 print:py-0">
        <ResumePreview snapshot={snapshot ?? {}} />
      </main>

      <p className="pb-8 text-center text-xs text-slate-400 print:hidden">
        ⚠ Temporary integration UI — Preview
      </p>
    </div>
  );
}
