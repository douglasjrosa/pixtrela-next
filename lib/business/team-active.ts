/** Strapi filter: teams with no end date are active. */
export const ACTIVE_TEAM_FILTER = {
  untill: { $null: true },
} as const;

/** Active when UNTILL is empty; inactive teams are historical only. */
export function isTeamActive(untill: string | null | undefined): boolean {
  return !untill;
}
