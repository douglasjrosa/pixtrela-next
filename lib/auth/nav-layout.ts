export const NAV_MEDIUM_MIN_WIDTH = 768;
export const NAV_LARGE_MIN_WIDTH = 1024;

export type NavLayoutMode = "desktop" | "mobile";

export function doesNavFit(
  availableWidth: number,
  requiredWidth: number,
): boolean {
  return requiredWidth <= availableWidth;
}

export function resolveNavLayoutMode(input: {
  viewportWidth: number;
  availableWidth: number;
  requiredWidth: number;
}): NavLayoutMode {
  if (input.viewportWidth >= NAV_LARGE_MIN_WIDTH) return "desktop";
  if (input.viewportWidth < NAV_MEDIUM_MIN_WIDTH) return "mobile";
  return doesNavFit(input.availableWidth, input.requiredWidth)
    ? "desktop"
    : "mobile";
}
