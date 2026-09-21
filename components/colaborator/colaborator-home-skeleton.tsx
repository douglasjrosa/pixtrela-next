export function ColaboratorHomeSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6 p-4" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div
          className="size-20 animate-pulse rounded-full bg-muted"
          aria-hidden
        />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" aria-hidden />
        <div className="h-5 w-48 animate-pulse rounded bg-muted" aria-hidden />
      </div>
      <div className="h-24 animate-pulse rounded-2xl border bg-muted/40" aria-hidden />
      <div className="h-24 animate-pulse rounded-2xl border bg-muted/40" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
