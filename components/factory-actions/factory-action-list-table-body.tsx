import type { FactoryAction } from "@/lib/business/factory-action";

import { FactoryActionListRowView } from "./factory-action-list-row";

export interface FactoryActionListTableBodyProps {
  actions: FactoryAction[];
  showCheckboxColumn?: boolean;
}

export function FactoryActionListTableBody({
  actions,
  showCheckboxColumn = false,
}: FactoryActionListTableBodyProps) {
  return (
    <tbody>
      {actions.map((action) => (
        <FactoryActionListRowView
          key={action.documentId}
          action={action}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
