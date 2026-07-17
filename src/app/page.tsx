import { getAuthenticatedUser } from "@/lib/supabase/session";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { AIWorkflow } from "@/components/landing/ai-workflow";
import { CTASection } from "@/components/landing/cta-section";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";
import LandingLayout from "@/components/landing/landing-layout";
import { LazySection } from "@/components/landing/lazy-section";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <>
      <LandingLayout>
        <Navbar user={user} />
        <Hero />
        <FeatureShowcase />
        <AIWorkflow />
        <CTASection
          headline="Ready to build your resume?"
          subtext="Join thousands of job seekers who trust AutoApply."
          gradient="from-blue-900/80 to-slate-800/90"
        />
        <LazySection>
          <Testimonials />
        </LazySection>
        <LazySection>
          <CTASection
            headline="Start building your future today"
            subtext="Create your free account and build a resume that gets results."
            gradient="from-purple-900/80 to-indigo-800/80"
          />
        </LazySection>
      </LandingLayout>
      <Footer />
    </>
  );
}
