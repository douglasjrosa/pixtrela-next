import { TaskListRow } from "./task-list-row";
import type { TaskRow } from "./types";

export interface TasksListMobileListProps {
  tasks: TaskRow[];
  selectionEnabled?: boolean;
}

export async function TasksListMobileList({
  tasks,
  selectionEnabled = false,
}: TasksListMobileListProps) {
  return (
    <ul className="md:hidden">
      {tasks.map((task) => (
        <TaskListRow
          key={task.documentId}
          task={task}
          variant="mobile"
          selectionEnabled={selectionEnabled}
        />
      ))}
    </ul>
  );
}
