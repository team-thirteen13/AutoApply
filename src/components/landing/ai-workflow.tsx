// ─────────────────────────────────────────────────────────────
// AI Workflow Preview Section
// ─────────────────────────────────────────────────────────────
// 4-step horizontal pipeline showing upcoming AI features.
// Responsive: horizontal on desktop, vertical on mobile.
// Server component — static content.
// ─────────────────────────────────────────────────────────────

import { Search, Target, FileText, BarChart3 } from "lucide-react";
import { WorkflowStep } from "./workflow-step";

const steps = [
  { number: 1, icon: Search, label: "Resume Analysis" },
  { number: 2, icon: Target, label: "Job Matching" },
  { number: 3, icon: FileText, label: "Cover Letters" },
  { number: 4, icon: BarChart3, label: "ATS Score" },
];

export function AIWorkflow() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-text-primary">
            Your AI-powered job search
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            We&apos;re building intelligent tools to supercharge your job
            application process. Here&apos;s what&apos;s coming.
          </p>
        </div>
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="contents">
              <WorkflowStep
                number={step.number}
                icon={step.icon}
                label={step.label}
              />
              {index < steps.length - 1 && (
                <>
                  <div className="hidden md:flex items-center justify-center text-text-secondary text-xl">
                    &rarr;
                  </div>
                  <div className="flex md:hidden items-center justify-center text-text-secondary text-xl">
                    &darr;
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
