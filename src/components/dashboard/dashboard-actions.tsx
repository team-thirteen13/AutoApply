"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { AtsOptimizationFlow } from "@/components/ai/ats-optimization";

// ─────────────────────────────────────────────────────────────
// Dashboard Actions
// ─────────────────────────────────────────────────────────────
// Client component providing dashboard actions:
// - Create New Resume (enabled)
// - Optimize CV with AI (opens ATS optimization flow)
// ─────────────────────────────────────────────────────────────

export function DashboardActions() {
  const [atsFlowOpen, setAtsFlowOpen] = useState(false);
  const optimizeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="flex gap-3">
        <Link
          href="/resumes/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          Create New Resume
        </Link>
        <button
          type="button"
          ref={optimizeButtonRef}
          onClick={() => setAtsFlowOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <Wand2 className="h-4 w-4" />
          Optimize CV with AI
        </button>
      </div>

      <AtsOptimizationFlow
        open={atsFlowOpen}
        onClose={() => setAtsFlowOpen(false)}
        triggerRef={optimizeButtonRef}
      />
    </>
  );
}
