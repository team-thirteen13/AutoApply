import { getAuthenticatedUser } from "@/lib/supabase/session";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import LandingLayout from "@/components/landing/landing-layout";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <LandingLayout>
      <Navbar user={user} />
      <Hero />
      <FeatureShowcase />
    </LandingLayout>
  );
}
