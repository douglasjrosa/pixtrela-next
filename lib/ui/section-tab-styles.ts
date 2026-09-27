import { cn } from "@/lib/utils";

/** Shared solid tab colors (active uses full opacity; inactive uses SECTION_TAB_INACTIVE_OPACITY). */
export const SECTION_TAB_SURFACE_CLASS = "bg-primary text-primary-foreground";

export const SECTION_TAB_INACTIVE_OPACITY_CLASS = "opacity-50";

export const SECTION_TAB_ACTIVE_OPACITY_CLASS = "opacity-100";

export const SECTION_TAB_LINK_BASE_CLASS = [
  "inline-flex items-center rounded-t-md px-3 text-sm font-medium",
  "transition-opacity",
  SECTION_TAB_SURFACE_CLASS,
].join(" ");

export const SECTION_TAB_ACTIVE_HEIGHT_CLASS = "min-h-10";

export const SECTION_TAB_INACTIVE_HEIGHT_CLASS = "min-h-8";

export function sectionTabLinkClass(isActive: boolean): string {
  return cn(
    SECTION_TAB_LINK_BASE_CLASS,
    isActive
      ? cn(SECTION_TAB_ACTIVE_HEIGHT_CLASS, SECTION_TAB_ACTIVE_OPACITY_CLASS)
      : cn(
          SECTION_TAB_INACTIVE_HEIGHT_CLASS,
          SECTION_TAB_INACTIVE_OPACITY_CLASS,
          "hover:opacity-70",
        ),
  );
}

export const SECTION_TABS_NAV_CLASS =
  "flex flex-wrap items-end gap-2 border-b pt-3";
