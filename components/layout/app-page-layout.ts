/**
 * Shared layout tokens for staff routes under the fixed AppNav (h-14 = 3.5rem).
 * Short-viewport rules (`max-[500px]`) target landscape phones (~375px tall).
 *
 * Page shells fill the opaque content surface from `(app)/layout.tsx`
 * (theme background shows in the outer padding around that surface).
 */

/** Fills the staff content surface (flex parent under AppNav). */
export const APP_CONTENT_HEIGHT_CLASS = "min-h-0 flex-1";

/**
 * Opaque panel over route theme backgrounds.
 * Radius comes from `routeThemeContentSurfaceRadiusClass(theme)`.
 */
export const APP_CONTENT_SURFACE_CLASS = [
  "flex min-h-0 flex-1 flex-col overflow-auto",
  "border text-card-foreground shadow-sm",
].join(" ");

/** Outer inset so the route theme remains visible around content.
 * Prefer `routeThemeContentFrameClass(theme)` for per-route margins.
 */
export const APP_CONTENT_FRAME_CLASS = "flex flex-1 flex-col p-3 sm:p-4";

/** Locked viewport page shell used by list/management routes. */
export const APP_LIST_PAGE_SHELL_CLASS = [
  "flex",
  APP_CONTENT_HEIGHT_CLASS,
  "flex-col gap-4 p-6",
  "max-[500px]:gap-2 max-[500px]:p-3",
].join(" ");

export const APP_LIST_PAGE_TITLE_CLASS =
  "text-2xl font-bold max-[500px]:text-lg";

export const APP_LIST_PAGE_CHROME_CLASS =
  "shrink-0 space-y-4 max-[500px]:space-y-2";

/** Inner stack (header + toolbar + list) inside a list page or section layout. */
export const APP_LIST_PAGE_STACK_CLASS = [
  "flex min-h-0 flex-1 flex-col gap-4",
  "max-[500px]:gap-2",
].join(" ");

/** Title + primary CTA row. */
export const APP_LIST_PAGE_HEADER_ROW_CLASS = [
  "flex shrink-0 items-center justify-between gap-3",
].join(" ");

/**
 * Compact SectionTabs link sizing on short viewports.
 * Pass as `className` to `SectionTabs`.
 */
export const APP_SECTION_TABS_COMPACT_CLASS = [
  "max-[500px]:gap-1",
  "[&_a]:max-[500px]:min-h-8 [&_a]:max-[500px]:px-2 [&_a]:max-[500px]:text-xs",
].join(" ");

/** Board canvas locked under the nav; columns scroll internally. */
export const APP_BOARD_SHELL_CLASS = [
  "flex",
  APP_CONTENT_HEIGHT_CLASS,
  "flex-col overflow-hidden",
].join(" ");
