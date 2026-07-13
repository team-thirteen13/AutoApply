"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { GenerateResumeFlow } from "@/components/ai/generate-resume-flow";

// ─────────────────────────────────────────────────────────────
// Dashboard Actions
// ─────────────────────────────────────────────────────────────
// Client component providing the "Generate with AI" entry point
// on the dashboard. Renders the generate flow slide-over panel.
// ─────────────────────────────────────────────────────────────

export function DashboardActions() {
  const [aiFlowOpen, setAiFlowOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
          ref={triggerRef}
          onClick={() => setAiFlowOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-medium text-violet-700 shadow-sm transition-all hover:bg-violet-50 hover:shadow-md"
        >
          <Wand2 className="h-4 w-4" />
          Generate with AI
        </button>
      </div>

      <GenerateResumeFlow
        open={aiFlowOpen}
        onClose={() => setAiFlowOpen(false)}
        mode="new"
        triggerRef={triggerRef}
      />
    </>
  );
}
