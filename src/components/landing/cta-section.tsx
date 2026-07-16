// ─────────────────────────────────────────────────────────────
// CTA Section
// ─────────────────────────────────────────────────────────────
// Reusable sign-up call-to-action banner.
// Server component with Link wrapping Button.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  headline: string;
  subtext: string;
}

export function CTASection({ headline, subtext }: CTASectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl font-bold text-text-primary">
          {headline}
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">{subtext}</p>
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
