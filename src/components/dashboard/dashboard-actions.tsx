"use client";

import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Dashboard Actions
// ─────────────────────────────────────────────────────────────
// Client component providing dashboard actions:
// - Create New Resume (enabled)
// - Optimize CV with AI (disabled, coming soon)
// ─────────────────────────────────────────────────────────────

export function DashboardActions() {
  return (
    <div className="flex gap-3">
      <Link
        href="/resumes/new"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
      >
        <Sparkles className="h-4 w-4" />
        Create New Resume
      </Link>
      <button
        disabled
        aria-describedby="optimize-cv-description"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-400 cursor-not-allowed shadow-sm"
      >
        <Wand2 className="h-4 w-4" />
        Optimize CV with AI
        <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          Coming soon
        </span>
      </button>
      <span id="optimize-cv-description" className="sr-only">
        Upload an existing CV and improve it with AI. Coming soon.
      </span>
    </div>
  );
}
