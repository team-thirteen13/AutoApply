"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Resume } from "@/types/resume";
import { deleteResumeAction } from "./actions";

interface ResumeCardProps {
  resume: Resume;
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const [, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const id = formData.get("id") as string;
      if (
        !window.confirm(
          "Are you sure you want to delete this resume? This action cannot be undone.",
        )
      ) {
        return { success: false, error: { message: "Cancelled" } };
      }
      return deleteResumeAction(id);
    },
    null,
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
        {resume.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Updated {new Date(resume.updatedAt).toLocaleDateString()}
      </p>
      {resume.targetRole && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Target: {resume.targetRole}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Link
          href={`/resumes/${resume.id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Edit
        </Link>
        <Link
          href={`/resumes/${resume.id}/preview`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Preview
        </Link>
        <form action={formAction}>
          <input type="hidden" name="id" value={resume.id} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </form>
      </div>
    </div>
  );
}
