/** Next.js cache tags for Strapi-backed data. */
export const STRAPI_TAGS = {
  steps: "strapi:steps",
  tasks: "strapi:tasks",
  subTasks: "strapi:sub-tasks",
  templateTasks: "strapi:template-tasks",
  activities: "strapi:activities",
  currencies: "strapi:currencies",
  kioskSetting: "strapi:kiosk-setting",
  awards: "strapi:awards",
  balance: "strapi:balance",
  teams: "strapi:teams",
  users: "strapi:users",
  exchanges: "strapi:exchanges",
} as const;

export function balanceTag(userId: string): string {
  return `${STRAPI_TAGS.balance}:${userId}`;
}
