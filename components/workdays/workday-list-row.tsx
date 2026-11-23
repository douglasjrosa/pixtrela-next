import { getTranslations } from "next-intl/server";

import { buildWorkdayRowLabels } from "@/lib/workdays/format-workday-row-labels";

import { WorkdayListRowPresentational } from "./workday-list-row-presentational";
import type { WorkdayRow } from "./types";

export interface WorkdayListRowViewProps {
  workday: WorkdayRow;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export async function WorkdayListRowView({
  workday,
  variant,
  showCheckboxColumn = false,
}: WorkdayListRowViewProps) {
  const [tWorkdays, tCommon] = await Promise.all([
    getTranslations("workdays"),
    getTranslations("common"),
  ]);
  const labels = buildWorkdayRowLabels(
    workday,
    (key, values) => tWorkdays(key, values),
    (key, values) => tCommon(key, values),
  );

  return (
    <WorkdayListRowPresentational
      workday={workday}
      variant={variant}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
