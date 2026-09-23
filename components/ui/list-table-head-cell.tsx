import type { ReactNode } from "react";

import {
  TABLE_HEAD_CELL_CENTER_CLASS,
  TABLE_HEAD_CELL_CLASS,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";

export interface ListTableHeadCellProps {
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Non-sortable column header for paginated admin list tables. */
export function ListTableHeadCell({
  children,
  align = "left",
  className,
}: ListTableHeadCellProps) {
  return (
    <th
      className={cn(
        align === "center" ? TABLE_HEAD_CELL_CENTER_CLASS : TABLE_HEAD_CELL_CLASS,
        className,
      )}
    >
      {children}
    </th>
  );
}
