/**
 * Opaque content panel over route theme backgrounds on colaborator / kiosk.
 * Frame padding: `routeThemeContentFrameClass(theme)`.
 * Corner radius: `routeThemeContentSurfaceRadiusClass(theme)`.
 */
export const COLABORATOR_CONTENT_SURFACE_CLASS = [
  "mx-auto w-full max-w-lg flex-1",
  "border text-card-foreground shadow-sm",
  "p-4 sm:p-6",
].join(" ");
