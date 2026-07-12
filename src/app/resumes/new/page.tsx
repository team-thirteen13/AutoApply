import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { createResume, createVersion } from "@/features/resume";

// ─────────────────────────────────────────────────────────────
// Create New Resume Page
// ─────────────────────────────────────────────────────────────
// Temporary integration UI for creating a new resume.
// Redirects to edit page after creation.
// ─────────────────────────────────────────────────────────────

async function createResumeFormAction(formData: FormData): Promise<void> {
  "use server";

  const title = formData.get("title") as string;
  const targetRole = (formData.get("targetRole") as string) || null;

  const result = await createResume({ title, targetRole });

  if (!result.success) {
    // For now, redirect back on error. In production, show error state.
    redirect("/resumes/new");
  }

  // Create initial empty version
  await createVersion(result.data.id, {}, { label: "Initial draft" });

  redirect(`/resumes/${result.data.id}/edit`);
}

export default async function NewResumePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

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
              Create New Resume
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Give your resume a title to get started. You can add details after
            creation.
          </p>

          <form action={createResumeFormAction}>
            <div className="mb-6">
              <label
                htmlFor="title"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Resume Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Software Engineer Resume"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="targetRole"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Target Role (optional)
              </label>
              <input
                id="targetRole"
                name="targetRole"
                type="text"
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Resume
              </button>
              <Link
                href="/dashboard"
                className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
