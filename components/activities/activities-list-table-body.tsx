import { ActivityListRow } from "./activity-list-row";
import type { ActivityRow } from "./types";

export interface ActivitiesListTableBodyProps {
  activities: ActivityRow[];
  showCheckboxColumn?: boolean;
}

export async function ActivitiesListTableBody({
  activities,
  showCheckboxColumn = false,
}: ActivitiesListTableBodyProps) {
  return (
    <tbody>
      {activities.map((activity) => (
        <ActivityListRow
          key={activity.documentId}
          activity={activity}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
