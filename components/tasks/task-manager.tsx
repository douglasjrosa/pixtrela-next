"use client";

/**
 * Back-compat surface for tests and detail imports.
 * Prefer TasksPageHeader + TasksListWithLoadMore on the /tasks page.
 */
export type { StepOption, TaskRow } from "./types";
export { TasksPageHeader as TaskManager } from "./tasks-page-header";
export type { TasksPageHeaderProps as TaskManagerProps } from "./tasks-page-header";
