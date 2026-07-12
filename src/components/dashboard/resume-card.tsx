"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Pencil, Eye, Trash2, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Resume } from "@/types/resume";
import { deleteResumeAction } from "@/app/dashboard/actions";

interface ResumeCardProps {
  resume: Resume;
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const updatedAgo = getRelativeTime(resume.updatedAt);

  return (
    <div className="group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
          {resume.title}
        </h3>
        {resume.targetRole && (
          <p className="mt-0.5 text-xs font-medium text-violet-600">
            {resume.targetRole}
          </p>
        )}
      </div>

      {/* Status & Time */}
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          Draft
        </span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-400">{updatedAgo}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/resumes/${resume.id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
        <Link
          href={`/resumes/${resume.id}/preview`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <form action={formAction}>
                <input type="hidden" name="id" value={resume.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
