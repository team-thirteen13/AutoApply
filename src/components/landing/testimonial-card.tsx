// ─────────────────────────────────────────────────────────────
// Testimonial Card
// ─────────────────────────────────────────────────────────────
// Individual testimonial card with avatar, quote, and attribution.
// Server component — static content.
// ─────────────────────────────────────────────────────────────

interface TestimonialCardProps {
  name: string;
  title: string;
  company: string;
  quote: string;
}

export function TestimonialCard({
  name,
  title,
  company,
  quote,
}: TestimonialCardProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-hero-start text-white font-heading font-bold text-sm">
        {initials}
      </div>
      <p className="text-text-secondary italic">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4">
        <p className="font-heading text-sm font-semibold text-text-primary">
          {name}
        </p>
        <p className="text-xs text-text-secondary">
          {title} at {company}
        </p>
      </div>
    </div>
  );
}
