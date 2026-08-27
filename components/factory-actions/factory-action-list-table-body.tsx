import type { FactoryAction } from "@/lib/business/factory-action";

import { FactoryActionListRowView } from "./factory-action-list-row";

export interface FactoryActionListTableBodyProps {
  actions: FactoryAction[];
}

export function FactoryActionListTableBody({
  actions,
}: FactoryActionListTableBodyProps) {
  return (
    <tbody>
      {actions.map((action) => (
        <FactoryActionListRowView
          key={action.documentId}
          action={action}
          variant="table"
        />
      ))}
    </tbody>
  );
}
