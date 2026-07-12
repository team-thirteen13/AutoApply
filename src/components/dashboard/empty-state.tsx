import Link from "next/link";
import { FilePlus2, Sparkles } from "lucide-react";

export function EmptyResumeState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50">
        <FilePlus2 className="h-10 w-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">
        Create your first resume
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Build a professional resume in minutes with our AI-powered builder.
        Stand out from the crowd.
      </p>
      <Link
        href="/resumes/new"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
      >
        <Sparkles className="h-4 w-4" />
        Create Resume
      </Link>
    </div>
  );
}
