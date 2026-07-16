import Link from "next/link";

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: React.ReactNode;
}

export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2"
          aria-label="ApplyAI home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-xl font-bold text-slate-900">ApplyAI</span>
        </Link>

        {/* Heading */}
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-slate-900">
          {heading}
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">{subheading}</p>

        {/* Form content */}
        {children}
      </div>
    </div>
  );
}
