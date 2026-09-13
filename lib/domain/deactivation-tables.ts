/** Physical Postgres table names used by shared deactivation reasons. */
export const DEACTIVATION_TABLE_NAMES = [
  "tasks",
  "users",
  "template_tasks",
  "actions",
  "sub_task_presets",
  "awards",
  "currencies",
  "teams",
] as const;

export type DeactivationTableName = (typeof DEACTIVATION_TABLE_NAMES)[number];

export const DEACTIVATION_TABLE = {
  tasks: "tasks",
  users: "users",
  templateTasks: "template_tasks",
  actions: "actions",
  subTaskPresets: "sub_task_presets",
  awards: "awards",
  currencies: "currencies",
  teams: "teams",
} as const satisfies Record<string, DeactivationTableName>;
