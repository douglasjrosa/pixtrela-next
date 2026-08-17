import { TaskListRow } from "./task-list-row";
import type { TaskRow } from "./types";

export interface TasksListMobileListProps {
  tasks: TaskRow[];
  showCheckboxColumn?: boolean;
}

export async function TasksListMobileList({
  tasks,
  showCheckboxColumn = false,
}: TasksListMobileListProps) {
  return (
    <ul className="md:hidden">
      {tasks.map((task) => (
        <TaskListRow
          key={task.documentId}
          task={task}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
