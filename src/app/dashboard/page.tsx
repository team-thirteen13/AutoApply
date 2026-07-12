import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getProfile } from "@/features/profile/get-profile";
import { listResumes } from "@/features/resume";
import { LogoutButton } from "./logout-button";
import { ResumeCard } from "./resume-card";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getProfile();
  const resumesResult = await listResumes();

  const resumes = resumesResult.success ? resumesResult.data : [];
  const profile = profileResult.success ? profileResult.data : null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ApplyAI
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ⚠ Temporary integration UI
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        {/* Profile Summary */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Profile
          </h2>
          {profile ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profile.name}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profile.email}
                </dd>
              </div>
              {profile.phone && (
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.phone}
                  </dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Location
                  </dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.location}
                  </dd>
                </div>
              )}
              {profile.tagline && (
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Tagline</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.tagline}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No profile yet. Your profile will be created automatically.
            </p>
          )}
        </section>

        {/* Resumes Section */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Resumes
              </h2>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {resumes.length}
              </p>
            </div>
            <Link
              href="/resumes/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Create Resume
            </Link>
          </div>

          {resumes.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No resumes yet
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Create your first resume to get started
              </p>
              <Link
                href="/resumes/new"
                className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Resume
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
