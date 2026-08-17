import { TaskListRow } from "./task-list-row";
import type { TaskRow } from "./types";

export interface TasksListTableBodyProps {
  tasks: TaskRow[];
  showCheckboxColumn?: boolean;
}

export async function TasksListTableBody({
  tasks,
  showCheckboxColumn = false,
}: TasksListTableBodyProps) {
  return (
    <tbody>
      {tasks.map((task) => (
        <TaskListRow
          key={task.documentId}
          task={task}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
