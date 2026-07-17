// ─────────────────────────────────────────────────────────────
// AI Workflow Preview Section
// ─────────────────────────────────────────────────────────────
// 4-step card grid showing upcoming AI features.
// Dark gradient cards with numbered steps.
// Server component — static content.
// ─────────────────────────────────────────────────────────────

import { Search, Target, FileText, BarChart3 } from "lucide-react";
import { WorkflowStep } from "./workflow-step";

const steps = [
  {
    icon: Search,
    number: "01",
    label: "Resume Analysis",
    description: "AI scans your resume to identify strengths, gaps, and optimization opportunities.",
    gradient: "from-blue-900/80 to-slate-800/90",
  },
  {
    icon: Target,
    number: "02",
    label: "Job Matching",
    description: "Intelligent matching connects your skills and experience to the right opportunities.",
    gradient: "from-blue-800/80 to-cyan-900/80",
  },
  {
    icon: FileText,
    number: "03",
    label: "Cover Letters",
    description: "Generate personalized cover letters tailored to each job application instantly.",
    gradient: "from-emerald-900/80 to-teal-800/80",
  },
  {
    icon: BarChart3,
    number: "04",
    label: "ATS Score",
    description: "Get your resume scored against applicant tracking systems before you apply.",
    gradient: "from-purple-900/80 to-violet-800/80",
  },
];

export function AIWorkflow() {
  return (
    <section className="py-24 bg-ai-start">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-white">
            Your AI-powered job search
          </h2>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
            We&apos;re building intelligent tools to supercharge your job
            application process. Here&apos;s what&apos;s coming.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <WorkflowStep
              key={step.label}
              icon={step.icon}
              number={step.number}
              label={step.label}
              description={step.description}
              gradient={step.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
