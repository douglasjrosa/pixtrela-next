/** Own profile (password + avatar + personal): colaborator only. */
export function canAccessOwnProfile(role: string | undefined): boolean {
  return role === "colaborator";
}
