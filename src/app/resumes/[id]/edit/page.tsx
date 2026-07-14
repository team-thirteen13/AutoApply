import { redirect, notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/session";
import { getResume, listVersions } from "@/features/resume";
import { ResumeBuilder } from "@/components/builder/resume-builder";

// ─────────────────────────────────────────────────────────────
// Edit Resume Page
// ─────────────────────────────────────────────────────────────

interface EditResumePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditResumePage({ params }: EditResumePageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const resumeResult = await getResume(id);

  if (!resumeResult.success) {
    notFound();
  }

  const versionsResult = await listVersions(id);
  const versions = versionsResult.success ? versionsResult.data : [];
  const latestVersion = versions[0];
  const snapshot = latestVersion?.snapshot ?? {};

  return (
    <ResumeBuilder
      resumeId={resumeResult.data.id}
      initialTitle={resumeResult.data.title}
      initialSnapshot={snapshot}
      initialFilePath={resumeResult.data.filePath}
    />
  );
}
