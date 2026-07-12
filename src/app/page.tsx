import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/session";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            ApplyAI
          </h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            AI-powered resume builder
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Login
              </Link>
            </>
          )}
        </div>

        <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-500">
          ⚠ Temporary integration-testing interface — not the final UI.
        </p>
      </main>
    </div>
  );
}
