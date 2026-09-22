export const ACTIVITIES_LIST_MUTATED_EVENT = "pixtrela:activities-mutated";

export function dispatchActivitiesListMutated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTIVITIES_LIST_MUTATED_EVENT));
}
