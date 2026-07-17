// ─────────────────────────────────────────────────────────────
// Testimonial Card
// ─────────────────────────────────────────────────────────────
// Individual testimonial card with avatar, quote, and attribution.
// Gradient card with photo placeholder.
// ─────────────────────────────────────────────────────────────

import { User } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  title: string;
  company: string;
  quote: string;
  gradient?: string;
}

export function TestimonialCard({
  name,
  title,
  company,
  quote,
  gradient = "from-blue-900/80 to-slate-800/90",
}: TestimonialCardProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <User className="h-6 w-6 text-white/70" />
      </div>
      <p className="text-white font-semibold">{quote}</p>
      <div className="mt-4">
        <p className="font-medium text-white/80">{name}</p>
        <p className="text-xs text-white/60">
          {title} at {company}
        </p>
      </div>
    </div>
  );
}
