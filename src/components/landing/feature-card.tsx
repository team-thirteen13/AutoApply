// ─────────────────────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────────────────────
// Individual feature card for the feature showcase section.
// Server component — static content with Tailwind hover effects.
// ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all motion-safe:hover:shadow-md motion-safe:hover:-translate-y-1">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-hero-start/10">
        <Icon className="h-6 w-6 text-hero-start" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
