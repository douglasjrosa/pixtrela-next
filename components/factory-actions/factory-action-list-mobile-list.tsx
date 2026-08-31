import type { FactoryAction } from "@/lib/business/factory-action";

import { FactoryActionListRowView } from "./factory-action-list-row";

export interface FactoryActionListMobileListProps {
  actions: FactoryAction[];
  showCheckboxColumn?: boolean;
}

export function FactoryActionListMobileList({
  actions,
  showCheckboxColumn = false,
}: FactoryActionListMobileListProps) {
  return (
    <ul className="md:hidden">
      {actions.map((action) => (
        <FactoryActionListRowView
          key={action.documentId}
          action={action}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
