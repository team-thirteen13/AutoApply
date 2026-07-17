// ─────────────────────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────────────────────
// Individual feature card for the feature showcase section.
// Gradient card with icon, title, and description.
// ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient = "from-blue-900/80 to-slate-800/90",
}: FeatureCardProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 transition-all motion-safe:hover:shadow-lg motion-safe:hover:-translate-y-1`}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  );
}
