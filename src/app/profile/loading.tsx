export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Loading profile" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Title skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-slate-200" />
        </div>

        {/* Completeness skeleton */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
        </div>

        {/* Profile card skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
