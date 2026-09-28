export type ActivityActionKind = "started" | "stoped";

/** Background class for started (green) vs stoped (gray) activity indicators. */
export function activityActionBadgeBackgroundClass(
  action: ActivityActionKind,
): string {
  return action === "started" ? "bg-green-600" : "bg-gray-600";
}
