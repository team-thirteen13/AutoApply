import { getAuthenticatedUser } from "@/lib/supabase/session";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <Hero />
    </div>
  );
}
