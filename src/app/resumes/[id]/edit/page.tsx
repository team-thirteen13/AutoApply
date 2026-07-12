import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getResume, listVersions } from "@/features/resume";
import { CVBuilderForm } from "@/features/resume/ui/cv-builder-form";

// ─────────────────────────────────────────────────────────────
// Edit Resume Page
// ─────────────────────────────────────────────────────────────
// Temporary integration UI for editing an existing resume.
// Loads the latest version snapshot into the CV Builder form.
// ─────────────────────────────────────────────────────────────

interface EditResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditResumePage({ params }: EditResumePageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Get resume (includes ownership check via RLS)
  const resumeResult = await getResume(id);

  if (!resumeResult.success) {
    notFound();
  }

  // Get latest version for snapshot data
  const versionsResult = await listVersions(id);
  const versions = versionsResult.success ? versionsResult.data : [];
  const latestVersion = versions[0];
  const snapshot = latestVersion?.snapshot ?? {};

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Edit Resume
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ⚠ Temporary integration UI
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <CVBuilderForm
          resumeId={resumeResult.data.id}
          initialTitle={resumeResult.data.title}
          initialSnapshot={snapshot}
        />
      </main>
    </div>
  );
}
