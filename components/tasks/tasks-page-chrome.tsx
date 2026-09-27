"use client";

import type { ReactNode } from "react";

import { ListPageChrome } from "@/components/ui/list-page-chrome";
import type { StepOption } from "@/components/tasks/types";

import { TasksPageHeader } from "./tasks-page-header";
import { TasksToolbar } from "./tasks-toolbar";

export function TasksPageChrome({
  steps,
  children,
}: {
  steps: StepOption[];
  children: ReactNode;
}) {
  return (
    <ListPageChrome
      toolbar={<TasksToolbar actions={<TasksPageHeader steps={steps} />} />}
    >
      {children}
    </ListPageChrome>
  );
}
