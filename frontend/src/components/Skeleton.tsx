/** Placeholder rows shaped like the list they replace, so nothing jumps when data arrives. */
export function ListSkeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="app-surface divide-y divide-slate-200">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6" aria-hidden="true">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="app-skeleton block h-4 w-2/5" />
            <span className="app-skeleton block h-3.5 w-1/4" />
          </div>
          <span className="app-skeleton hidden h-6 w-28 sm:block" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
