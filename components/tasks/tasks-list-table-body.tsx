import { TaskListRow } from "./task-list-row";
import type { TaskRow } from "./types";

export interface TasksListTableBodyProps {
  tasks: TaskRow[];
  selectionEnabled?: boolean;
}

export async function TasksListTableBody({
  tasks,
  selectionEnabled = false,
}: TasksListTableBodyProps) {
  return (
    <tbody>
      {tasks.map((task) => (
        <TaskListRow
          key={task.documentId}
          task={task}
          variant="table"
          selectionEnabled={selectionEnabled}
        />
      ))}
    </tbody>
  );
}
