import { WorkdayListRowView } from "./workday-list-row";
import type { WorkdayRow } from "./types";

export interface WorkdaysListMobileListProps {
  workdays: WorkdayRow[];
  showCheckboxColumn?: boolean;
}

export async function WorkdaysListMobileList({
  workdays,
  showCheckboxColumn = false,
}: WorkdaysListMobileListProps) {
  return (
    <ul className="md:hidden">
      {workdays.map((workday) => (
        <WorkdayListRowView
          key={workday.documentId}
          workday={workday}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
