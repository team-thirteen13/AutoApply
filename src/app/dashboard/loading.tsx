export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome section skeleton */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-5 w-56 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="flex gap-3">
              <div className="h-12 w-40 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-12 w-36 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-7 w-12 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Resumes section skeleton */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
