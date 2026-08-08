/** Own profile (password + avatar + personal): manager, leader, colaborator. */
export function canAccessOwnProfile(role: string | undefined): boolean {
  return role === "colaborator" || role === "leader" || role === "manager";
}
