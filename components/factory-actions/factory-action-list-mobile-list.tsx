import type { FactoryAction } from "@/lib/business/factory-action";

import { FactoryActionListRowView } from "./factory-action-list-row";

export interface FactoryActionListMobileListProps {
  actions: FactoryAction[];
}

export function FactoryActionListMobileList({
  actions,
}: FactoryActionListMobileListProps) {
  return (
    <ul className="md:hidden">
      {actions.map((action) => (
        <FactoryActionListRowView
          key={action.documentId}
          action={action}
          variant="mobile"
        />
      ))}
    </ul>
  );
}
