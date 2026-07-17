// ─────────────────────────────────────────────────────────────
// Testimonials Section
// ─────────────────────────────────────────────────────────────
// 6-card horizontal scroll carousel with social proof.
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
    gradient: "from-blue-900/80 to-slate-800/90",
  },
  {
    name: "Marcus Johnson",
    title: "Product Manager",
    company: "Stripe",
    quote:
      "I was spending hours tweaking my resume for each application. AutoApply made it effortless to create targeted versions.",
    gradient: "from-blue-800/80 to-cyan-900/80",
  },
  {
    name: "Priya Patel",
    title: "Data Scientist",
    company: "Meta",
    quote:
      "The profile system is brilliant — I update once and every resume stays in sync. Saved me so much time during my job search.",
    gradient: "from-emerald-900/80 to-teal-800/80",
  },
  {
    name: "Alex Rivera",
    title: "Frontend Developer",
    company: "Vercel",
    quote:
      "The template system is clean and professional. I landed three interviews in my first week using AutoApply.",
    gradient: "from-purple-900/80 to-violet-800/80",
  },
  {
    name: "Jamie Nguyen",
    title: "DevOps Engineer",
    company: "Cloudflare",
    quote:
      "Finally a resume tool that understands technical roles. The skills section alone saved me hours of formatting.",
    gradient: "from-blue-900/80 to-indigo-800/80",
  },
  {
    name: "Taylor Kim",
    title: "UX Designer",
    company: "Figma",
    quote:
      "AutoApply's profile system meant I could create role-specific resumes without starting from scratch each time.",
    gradient: "from-cyan-900/80 to-blue-800/80",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-testimonials-start">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl font-bold text-text-primary">
            Loved by job seekers
          </h2>
          <p className="mt-4 text-text-secondary">
            See what our users have to say about AutoApply.
          </p>
        </div>
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="snap-center shrink-0 w-[85vw] sm:w-[400px]">
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
