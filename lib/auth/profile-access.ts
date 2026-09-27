/** Own profile / shop / orders: colaborator and producing leader. */
export function canAccessOwnProfile(role: string | undefined): boolean {
  return role === "colaborator" || role === "leader";
}
