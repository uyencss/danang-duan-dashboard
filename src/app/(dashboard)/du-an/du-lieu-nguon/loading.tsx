export default function Loading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-28 bg-slate-200 rounded-md animate-pulse"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 p-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-4 flex-1 bg-slate-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-3 border-t border-slate-100">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div
                  key={j}
                  className="h-4 flex-1 bg-slate-100 rounded animate-pulse"
                  style={{ animationDelay: `${(i + j) * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
