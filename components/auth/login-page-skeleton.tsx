export function LoginPageSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex w-full max-w-lg flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto h-8 w-56 animate-pulse rounded bg-muted" aria-hidden />
      <div className="space-y-3 rounded-xl border bg-card p-6">
        <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
        <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
        <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
