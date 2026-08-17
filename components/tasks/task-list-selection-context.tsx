"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type TaskListSelectionContextValue = {
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelect: (documentId: string) => void;
  onToggleSelectAll: () => void;
};

const TaskListSelectionContext =
  createContext<TaskListSelectionContextValue | null>(null);

export function TaskListSelectionProvider({
  value,
  children,
}: {
  value: TaskListSelectionContextValue | null;
  children: ReactNode;
}) {
  return (
    <TaskListSelectionContext.Provider value={value}>
      {children}
    </TaskListSelectionContext.Provider>
  );
}

export function useTaskListSelection(): TaskListSelectionContextValue | null {
  return useContext(TaskListSelectionContext);
}
