"use client";

import { useTranslations } from "next-intl";

import { formatDecimalPtBr } from "@/lib/format/decimal";
import type { FactoryAction } from "@/lib/business/factory-action";

import {
  FactoryActionListRowPresentational,
  type FactoryActionListRowLabels,
} from "./factory-action-list-row-presentational";

export interface FactoryActionListRowProps {
  action: FactoryAction;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export function FactoryActionListRowView({
  action,
  variant,
  showCheckboxColumn = false,
}: FactoryActionListRowProps) {
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const labels: FactoryActionListRowLabels = {
    unitTime: formatDecimalPtBr(action.unitTime),
    qtyQuestion: action.qtyQuestion,
    description: action.description,
    inactive: tTemplates("inactive"),
    selectRow: tCommon("selectRow", { name: action.name }),
  };

  return (
    <FactoryActionListRowPresentational
      action={action}
      variant={variant}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
