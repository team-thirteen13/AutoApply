import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getProfile } from "@/features/profile/get-profile";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getProfile();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            ApplyAI Dashboard
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Account
          </h2>
          <p className="text-zinc-900 dark:text-zinc-100">{user.email}</p>
          <p className="mt-1 text-xs text-zinc-400">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Profile
          </h2>
          {profileResult.success ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profileResult.data.name}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profileResult.data.email}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Phone</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profileResult.data.phone}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {profileResult.data.location}
                </dd>
              </div>
              {profileResult.data.tagline && (
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Tagline</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profileResult.data.tagline}
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
      </main>
    </div>
  );
}
