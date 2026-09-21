export function AppFormSkeleton({
  label,
  fieldCount = 4,
}: {
  label: string;
  fieldCount?: number;
}) {
  return (
    <div className="space-y-4 p-6" aria-busy="true" aria-live="polite">
      {Array.from({ length: fieldCount }, (_, index) => (
        <div key={index} className="space-y-2" aria-hidden>
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/60" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
