"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FilePlus2, Sparkles, Wand2 } from "lucide-react";
import { AtsOptimizationFlow } from "@/components/ai/ats-optimization";

export function EmptyResumeState() {
  const [atsFlowOpen, setAtsFlowOpen] = useState(false);
  const optimizeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50">
          <FilePlus2 className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Create your first resume
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Build a professional resume in minutes with our AI-powered builder.
          Stand out from the crowd.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/resumes/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            Create Resume
          </Link>
          <button
            ref={optimizeButtonRef}
            onClick={() => setAtsFlowOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Wand2 className="h-4 w-4" />
            Optimize CV with AI
          </button>
        </div>
      </div>

      <AtsOptimizationFlow
        open={atsFlowOpen}
        onClose={() => setAtsFlowOpen(false)}
        triggerRef={optimizeButtonRef}
      />
    </>
  );
}
