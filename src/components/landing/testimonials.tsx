// ─────────────────────────────────────────────────────────────
// Testimonials Section
// ─────────────────────────────────────────────────────────────
// 3-column grid of testimonial cards with social proof.
// Server component — static content with placeholder data.
// ─────────────────────────────────────────────────────────────

import { TestimonialCard } from "./testimonial-card";

const testimonials = [
  {
    name: "Sarah Chen",
    title: "Software Engineer",
    company: "Google",
    quote:
      "AutoApply helped me craft a resume that actually got noticed. The AI suggestions were spot-on for my industry.",
  },
  {
    name: "Marcus Johnson",
    title: "Product Manager",
    company: "Stripe",
    quote:
      "I was spending hours tweaking my resume for each application. AutoApply made it effortless to create targeted versions.",
  },
  {
    name: "Priya Patel",
    title: "Data Scientist",
    company: "Meta",
    quote:
      "The profile system is brilliant — I update once and every resume stays in sync. Saved me so much time during my job search.",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-text-primary">
            Loved by job seekers
          </h2>
          <p className="mt-4 text-text-secondary">
            See what our users have to say about AutoApply.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
