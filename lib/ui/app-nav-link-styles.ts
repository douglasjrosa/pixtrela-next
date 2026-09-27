import { cn } from "@/lib/utils";

/** Active nav link uses the same solid primary surface as section tabs. */
export const APP_NAV_LINK_SURFACE_CLASS =
  "bg-primary text-primary-foreground";

export const APP_NAV_LINK_BASE_CLASS =
  "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function appNavLinkClass(isActive: boolean): string {
  return cn(
    APP_NAV_LINK_BASE_CLASS,
    isActive
      ? APP_NAV_LINK_SURFACE_CLASS
      : cn(
          "text-foreground",
          "hover:bg-secondary hover:text-secondary-foreground",
        ),
  );
}
