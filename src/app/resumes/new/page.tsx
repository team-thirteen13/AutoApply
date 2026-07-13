"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createResumeAction } from "@/app/resumes/actions";

// ─────────────────────────────────────────────────────────────
// Create New Resume Page
// ─────────────────────────────────────────────────────────────
// Client component with structured form errors, pending state,
// and canonical action call. No private duplicate action.

export default function NewResumePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const trimmedTitle = title.trim();

    // Client-side validation
    if (!trimmedTitle) {
      setFieldErrors({ title: "Title is required" });
      return;
    }

    if (trimmedTitle.length > 200) {
      setFieldErrors({ title: "Title must be 200 characters or less" });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createResumeAction(
          trimmedTitle,
          targetRole.trim() || null,
        );

        if (!result.success) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          setFormError(result.error);
          return;
        }

        // Success — navigate to the builder
        router.push(`/resumes/${result.resumeId}/edit`);
      } catch {
        setFormError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
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

          <form onSubmit={handleSubmit} noValidate>
            {/* Form-level error */}
            {formError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            {/* Title field */}
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
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                disabled={isPending}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? "title-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  fieldErrors.title
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldErrors.title && (
                <p id="title-error" className="mt-1.5 text-xs text-red-600">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Target role field */}
            <div className="mb-8">
              <label
                htmlFor="targetRole"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Target Role{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="targetRole"
                name="targetRole"
                type="text"
                placeholder="e.g. Senior Software Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:brightness-100"
            >
              {isPending ? "Creating..." : "Create Resume"}
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
