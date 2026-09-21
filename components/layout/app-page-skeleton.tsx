import {
  APP_LIST_PAGE_HEADER_ROW_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
} from "@/components/layout/app-page-layout";

export const PAGE_LIST_SKELETON_ROW_COUNT = 6;

export function AppPageSkeleton({
  label,
  rowCount = PAGE_LIST_SKELETON_ROW_COUNT,
  showAction = true,
}: {
  label: string;
  rowCount?: number;
  showAction?: boolean;
}) {
  return (
    <section
      className={APP_LIST_PAGE_SHELL_CLASS}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={APP_LIST_PAGE_HEADER_ROW_CLASS}>
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" aria-hidden />
        {showAction ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
        ) : null}
      </div>
      <ul className="space-y-2">
        {Array.from({ length: rowCount }, (_, index) => (
          <li
            key={index}
            className="h-12 animate-pulse rounded-lg border bg-muted/40"
            aria-hidden
          />
        ))}
      </ul>
      <span className="sr-only">{label}</span>
    </section>
  );
}
