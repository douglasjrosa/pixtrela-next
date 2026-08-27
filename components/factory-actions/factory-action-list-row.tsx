import { formatDecimalPtBr } from "@/lib/format/decimal";
import type { FactoryAction } from "@/lib/business/factory-action";

import {
  FactoryActionListRowPresentational,
  type FactoryActionListRowLabels,
} from "./factory-action-list-row-presentational";

export interface FactoryActionListRowProps {
  action: FactoryAction;
  variant: "table" | "mobile";
}

export function FactoryActionListRowView({
  action,
  variant,
}: FactoryActionListRowProps) {
  const labels: FactoryActionListRowLabels = {
    unitTime: formatDecimalPtBr(action.unitTime),
    qtyQuestion: action.qtyQuestion,
  };

  return (
    <FactoryActionListRowPresentational
      action={action}
      variant={variant}
      labels={labels}
    />
  );
}
