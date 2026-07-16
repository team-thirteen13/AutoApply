import { getAuthenticatedUser } from "@/lib/supabase/session";
import { Navbar } from "@/components/landing/navbar";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      {/* Placeholder: hero section will be added in next plan */}
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 pt-16 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            AutoApply
          </h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            AI-powered resume builder
          </p>
        </div>
      </main>
    </div>
  );
}
