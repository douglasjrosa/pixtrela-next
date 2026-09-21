import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { KanbanCardSkeleton } from "@/components/kanban/kanban-card-skeleton";

export const BOARD_SKELETON_COLUMN_COUNT = 4;
export const BOARD_SKELETON_CARDS_PER_COLUMN = 3;

export function AppBoardSkeleton({ label }: { label: string }) {
  return (
    <div
      className={APP_BOARD_SHELL_CLASS}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3">
        {Array.from({ length: BOARD_SKELETON_COLUMN_COUNT }, (_, column) => (
          <div
            key={column}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border p-2"
          >
            <div className="h-6 w-24 animate-pulse rounded bg-muted" aria-hidden />
            {Array.from(
              { length: BOARD_SKELETON_CARDS_PER_COLUMN },
              (__, card) => (
                <KanbanCardSkeleton key={card} announce={false} />
              ),
            )}
          </div>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
