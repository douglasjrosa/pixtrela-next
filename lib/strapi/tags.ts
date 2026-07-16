/** Next.js cache tags for Strapi-backed data. */
export const STRAPI_TAGS = {
  steps: "strapi:steps",
  tasks: "strapi:tasks",
  subTasks: "strapi:sub-tasks",
  templateTasks: "strapi:template-tasks",
  subTaskPresets: "strapi:sub-task-presets",
  activities: "strapi:activities",
  currencies: "strapi:currencies",
  currencyForSubtasks: "strapi:currency-for-subtasks",
  kioskSetting: "strapi:kiosk-setting",
  taskAutomationSetting: "strapi:task-automation-setting",
  awards: "strapi:awards",
  balance: "strapi:balance",
  teams: "strapi:teams",
  users: "strapi:users",
  exchanges: "strapi:exchanges",
  dashboardRanking: "strapi:dashboard:ranking",
} as const;

export function balanceTag(userId: string): string {
  return `${STRAPI_TAGS.balance}:${userId}`;
}

export function dashboardColaboratorTag(documentId: string): string {
  return `strapi:dashboard:colaborator:${documentId}`;
}
