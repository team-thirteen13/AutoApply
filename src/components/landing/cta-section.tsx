// ─────────────────────────────────────────────────────────────
// CTA Section
// ─────────────────────────────────────────────────────────────
// Reusable sign-up call-to-action banner.
// Dark gradient background with white text.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  headline: string;
  subtext: string;
  gradient?: string;
}

export function CTASection({
  headline,
  subtext,
  gradient = "from-blue-900/80 to-slate-800/90",
}: CTASectionProps) {
  return (
    <section className={`py-16 bg-gradient-to-br ${gradient}`}>
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-white">
          {headline}
        </h2>
        <p className="mt-4 text-slate-300 max-w-xl mx-auto">{subtext}</p>
        <div className="mt-8">
          <Link href="/register">
            <Button variant="gradient" size="lg">
              Sign Up for Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
