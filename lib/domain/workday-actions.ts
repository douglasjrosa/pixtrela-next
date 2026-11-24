export const WORKDAY_ACTIONS = [
  "absence",
  "excused_absence",
  "partial_absence",
  "partial_excused_absence",
  "off",
  "holiday",
  "work",
  "overtime",
  "make_up",
] as const;

export type WorkdayAction = (typeof WORKDAY_ACTIONS)[number];

export const WORKDAY_ACTION_CLASSES = [
  "absence_family",
  "extra",
  "civil_off",
  "work",
] as const;

export type WorkdayActionClass = (typeof WORKDAY_ACTION_CLASSES)[number];

export type WorkdayPolarity = "work" | "off";

export const LEADER_WORKDAY_ACTIONS = [
  "absence",
  "excused_absence",
  "partial_absence",
  "partial_excused_absence",
  "overtime",
  "make_up",
] as const;

export type LeaderWorkdayAction = (typeof LEADER_WORKDAY_ACTIONS)[number];

export const DESCRIPTION_REQUIRED_ACTIONS = [
  "excused_absence",
  "partial_excused_absence",
  "make_up",
] as const;

export const CIVIL_DAY_ACTIONS = [
  "absence",
  "excused_absence",
  "holiday",
] as const;

export const LEADER_PAST_ACTION_FLIPS = {
  absence: "excused_absence",
  partial_absence: "partial_excused_absence",
} as const;

export type LeaderPastFlipSource = keyof typeof LEADER_PAST_ACTION_FLIPS;

export const WORKDAY_ACTION_CLASS_RANK: Record<WorkdayActionClass, number> = {
  absence_family: 4,
  extra: 3,
  civil_off: 2,
  work: 1,
};

const ABSENCE_FAMILY = new Set<WorkdayAction>([
  "absence",
  "excused_absence",
  "partial_absence",
  "partial_excused_absence",
]);

const EXTRA_ACTIONS = new Set<WorkdayAction>(["overtime", "make_up"]);
const CIVIL_OFF_ACTIONS = new Set<WorkdayAction>(["holiday", "off"]);
const CIVIL_DAY_SET = new Set<WorkdayAction>(CIVIL_DAY_ACTIONS);
const DESCRIPTION_REQUIRED_SET = new Set<WorkdayAction>(
  DESCRIPTION_REQUIRED_ACTIONS,
);
const LEADER_ACTION_SET = new Set<WorkdayAction>(LEADER_WORKDAY_ACTIONS);

export function workdayActionClass(action: WorkdayAction): WorkdayActionClass {
  if (ABSENCE_FAMILY.has(action)) return "absence_family";
  if (EXTRA_ACTIONS.has(action)) return "extra";
  if (CIVIL_OFF_ACTIONS.has(action)) return "civil_off";
  return "work";
}

export function workdayActionClassRank(action: WorkdayAction): number {
  return WORKDAY_ACTION_CLASS_RANK[workdayActionClass(action)];
}

export function workdayPolarity(action: WorkdayAction): WorkdayPolarity {
  const actionClass = workdayActionClass(action);
  if (actionClass === "extra" || actionClass === "work") return "work";
  return "off";
}

export function isCivilDayWorkdayAction(action: WorkdayAction): boolean {
  return CIVIL_DAY_SET.has(action);
}

export function isRecurrentWorkdayAction(action: WorkdayAction): boolean {
  return action === "work";
}

export function isLeaderWorkdayAction(action: WorkdayAction): boolean {
  return LEADER_ACTION_SET.has(action);
}

export function requiresWorkdayDescription(action: WorkdayAction): boolean {
  return DESCRIPTION_REQUIRED_SET.has(action);
}

export function allowedWorkdayScopes(
  action: WorkdayAction,
): Array<"global" | "team" | "user"> {
  if (action === "holiday") return ["global"];
  if (action === "work" || action === "off") return ["global", "team", "user"];
  return ["user"];
}

export function defaultWorkdayScope(
  action: WorkdayAction,
): "global" | "team" | "user" {
  if (action === "work" || action === "holiday") return "global";
  return "user";
}

export function defaultWorkdayActionForRole(
  role: "admin" | "manager" | "leader" | "colaborator" | "kiosk" | undefined,
): WorkdayAction {
  if (role === "leader") return "absence";
  return "work";
}

export function leaderPastFlipTarget(
  action: WorkdayAction,
): WorkdayAction | null {
  if (action === "absence" || action === "partial_absence") {
    return LEADER_PAST_ACTION_FLIPS[action];
  }
  return null;
}
