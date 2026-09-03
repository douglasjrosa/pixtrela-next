export function KioskQueueCardSkeleton() {
  return (
    <li
      className="animate-pulse rounded-2xl border bg-card p-4"
      aria-hidden
      data-testid="kiosk-queue-card-skeleton"
    >
      <div className="space-y-3">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-5 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-10 w-full rounded-xl bg-muted" />
      </div>
    </li>
  );
}

export function KioskQueueSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <KioskQueueCardSkeleton key={index} />
      ))}
    </ul>
  );
}
