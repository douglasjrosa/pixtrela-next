import type { ReactNode } from "react";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { cn } from "@/lib/utils";

export interface ListTableHeadShellProps {
  showCheckboxColumn?: boolean;
  selectAllAriaLabel?: string;
  children: ReactNode;
}

export function ListTableHeadShell({
  showCheckboxColumn = false,
  selectAllAriaLabel,
  children,
}: ListTableHeadShellProps) {
  return (
    <thead>
      <tr className="border-b text-left">
        {showCheckboxColumn ? (
          <th className={cn("w-10 py-2", "text-center")}>
            <ListRowCheckbox
              documentId=""
              variant="table-header"
              selectAll
              ariaLabel={selectAllAriaLabel ?? ""}
            />
          </th>
        ) : null}
        {children}
      </tr>
    </thead>
  );
}
