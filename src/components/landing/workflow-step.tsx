// ─────────────────────────────────────────────────────────────
// Workflow Step
// ─────────────────────────────────────────────────────────────
// Individual step in the AI workflow pipeline.
// Shows a numbered circle, icon, and label.
// ─────────────────────────────────────────────────────────────

interface WorkflowStepProps {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function WorkflowStep({ number, icon: Icon, label }: WorkflowStepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-heading font-bold text-lg">
        {number}
      </div>
      <Icon className="h-6 w-6 text-accent mt-3" />
      <span className="mt-2 text-sm font-medium text-text-primary">
        {label}
      </span>
    </div>
  );
}
