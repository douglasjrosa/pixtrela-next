/** Monthly ranking lists active colaborators only. Leaders never enter. */
export function isMonthlyRankingParticipantRole(role: string): boolean {
  return role === "colaborator";
}
