import { ActivityListRow } from "./activity-list-row";
import type { ActivityRow } from "./types";

export interface ActivitiesListMobileListProps {
  activities: ActivityRow[];
  showCheckboxColumn?: boolean;
}

export async function ActivitiesListMobileList({
  activities,
  showCheckboxColumn = false,
}: ActivitiesListMobileListProps) {
  return (
    <ul className="md:hidden">
      {activities.map((activity) => (
        <ActivityListRow
          key={activity.documentId}
          activity={activity}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
