import { WorkdayListRowView } from "./workday-list-row";
import type { WorkdayRow } from "./types";

export interface WorkdaysListTableBodyProps {
  workdays: WorkdayRow[];
  showCheckboxColumn?: boolean;
}

export async function WorkdaysListTableBody({
  workdays,
  showCheckboxColumn = false,
}: WorkdaysListTableBodyProps) {
  return (
    <tbody>
      {workdays.map((workday) => (
        <WorkdayListRowView
          key={workday.documentId}
          workday={workday}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
