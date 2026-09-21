import { getTranslations } from "next-intl/server";

import {
  ActivityListRowPresentational,
  type ActivityListRowLabels,
} from "./activity-list-row-presentational";
import type { ActivityRow } from "./types";

export interface ActivityListRowProps {
  activity: ActivityRow;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export async function ActivityListRow({
  activity,
  variant,
  showCheckboxColumn = false,
}: ActivityListRowProps) {
  const t = await getTranslations("activities");
  const tCommon = await getTranslations("common");
  const labels: ActivityListRowLabels = {
    inactive: t("inactive"),
    started: t("action.started"),
    stoped: t("action.stoped"),
    selectRow: tCommon("selectRow", { name: activity.colaboratorName }),
  };

  return (
    <ActivityListRowPresentational
      activity={activity}
      variant={variant}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
