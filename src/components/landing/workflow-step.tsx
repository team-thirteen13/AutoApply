// ─────────────────────────────────────────────────────────────
// Workflow Step
// ─────────────────────────────────────────────────────────────
// Individual step card in the AI workflow grid.
// Dark gradient card with icon, number, label, and description.
// ─────────────────────────────────────────────────────────────

interface WorkflowStepProps {
  icon: React.ComponentType<{ className?: string }>;
  number: string;
  label: string;
  description?: string;
  gradient?: string;
}

export function WorkflowStep({
  icon: Icon,
  number,
  label,
  description,
  gradient = "from-blue-900/80 to-slate-800/90",
}: WorkflowStepProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 flex flex-col h-full`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium text-white/50">{number}</span>
      </div>
      <h3 className="font-heading text-xl font-bold text-white">{label}</h3>
      <p className="text-sm text-slate-300 mt-2 flex-1">{description}</p>
    </div>
  );
}
