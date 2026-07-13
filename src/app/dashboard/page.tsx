import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Rocket } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getProfile } from "@/features/profile/get-profile";
import { listResumes } from "@/features/resume";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { EmptyResumeState } from "@/components/dashboard/empty-state";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getProfile();
  const resumesResult = await listResumes();

  // Handle profile fetch failure - redirect to login if auth error
  if (!profileResult.success) {
    if (profileResult.error.code === "authentication_required") {
      redirect("/login");
    }
    // For other profile errors, continue with null profile
  }

  // Handle resumes fetch failure - throw to trigger error boundary
  if (!resumesResult.success) {
    throw new Error("Failed to load resumes. Please try again.");
  }

  const resumes = resumesResult.data;
  const profile = profileResult.success ? profileResult.data : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      <DashboardHeader email={user.email ?? ""} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Build your next winning resume
              </h1>
              <p className="mt-2 text-base text-slate-500">
                {profile?.name
                  ? `Welcome back, ${profile.name}. Ready to craft something amazing?`
                  : "Create professional resumes with AI-powered suggestions."}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/resumes/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                Create New Resume
              </Link>
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-400 shadow-sm cursor-not-allowed"
              >
                <Rocket className="h-4 w-4" />
                View Templates
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsCards resumes={resumes} />
        </div>

        {/* Resumes Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Resumes
            </h2>
            {resumes.length > 0 && (
              <Link
                href="/resumes/new"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                + New Resume
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <EmptyResumeState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
