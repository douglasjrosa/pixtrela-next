/** True when this browser tab is the selected one. */
export function isBrowserTabVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}
