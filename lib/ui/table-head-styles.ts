import { cn } from "@/lib/utils";

export const TABLE_HEAD_TEXT_CLASS = "font-medium text-primary";

export const TABLE_HEAD_CELL_CLASS = `py-2 ${TABLE_HEAD_TEXT_CLASS}`;

export const TABLE_HEAD_CELL_CENTER_CLASS = `${TABLE_HEAD_CELL_CLASS} text-center`;

/** Shared layout/focus styles for sortable list column header links. */
export const LIST_SORT_HEADER_LINK_BASE_CLASS =
  "flex w-full items-center gap-1 rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** @deprecated Use listSortHeaderLinkClass instead. */
export const LIST_SORT_HEADER_LINK_CLASS = "text-primary";

/** Active sort column uses semibold; inactive columns stay medium. */
export function listSortHeaderFontClass(active: boolean): string {
  return active ? "font-semibold" : "font-medium";
}

/** Text, weight, and background for sortable list column headers. */
export function listSortHeaderLinkClass(active: boolean): string {
  if (active) {
    return cn(
      "font-semibold bg-primary text-primary-foreground hover:bg-primary/90",
    );
  }
  return cn("font-medium text-primary hover:bg-muted");
}
