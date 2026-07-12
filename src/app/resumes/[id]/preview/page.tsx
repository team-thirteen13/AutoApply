"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ResumeSnapshot } from "@/types/resume";
import { getResumeAction } from "../../actions";
import { PreviewSections } from "@/features/resume/ui/preview-sections";

// ─────────────────────────────────────────────────────────────
// Resume Preview Page
// ─────────────────────────────────────────────────────────────
// Temporary integration UI for previewing a resume.
// Displays a professional preview with print and export options.
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading resume...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ⚠ Temporary integration UI — Preview
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/resumes/${id}/edit`}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              🖨 Print
            </button>
            <button
              type="button"
              disabled
              title="PDF export not yet implemented"
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
            >
              📄 Export PDF (Coming Soon)
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:border-0 print:shadow-none">
          <PreviewSections snapshot={snapshot ?? {}} />
        </div>
      </main>
    </div>
  );
}
