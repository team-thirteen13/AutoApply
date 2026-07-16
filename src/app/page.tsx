import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/session";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 px-4">
      <main className="flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-bold text-white shadow-lg">
            A
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            ApplyAI
          </h1>
        </div>

        <p className="text-lg text-slate-500">
          AI-powered resume builder
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
