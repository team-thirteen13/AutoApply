import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { createResume, createVersion } from "@/features/resume";

// ─────────────────────────────────────────────────────────────
// Create New Resume Page
// ─────────────────────────────────────────────────────────────

async function createResumeFormAction(formData: FormData): Promise<void> {
  "use server";

  const title = formData.get("title") as string;
  const targetRole = (formData.get("targetRole") as string) || null;

  const result = await createResume({ title, targetRole });

  if (!result.success) {
    redirect("/resumes/new");
  }

  await createVersion(result.data.id, {}, { label: "Initial draft" });
  redirect(`/resumes/${result.data.id}/edit`);
}

export default async function NewResumePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Simple form for initial creation */}
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create New Resume
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Give your resume a title to get started
            </p>
          </div>

          <form action={createResumeFormAction}>
            <div className="mb-6">
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Resume Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Senior Software Engineer Resume"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="targetRole"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Target Role{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="targetRole"
                name="targetRole"
                type="text"
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
            >
              Create Resume
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            ⚠ Temporary integration UI — not the final design
          </p>
        </div>
      </div>
    </div>
  );
}
