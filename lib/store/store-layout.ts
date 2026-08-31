/** Netflix-style horizontal catalogs; the page itself scrolls vertically. */
export const STORE_PAGE_SHELL_CLASS = "min-w-0 space-y-6 overflow-x-hidden";

export const STORE_ROW_SCROLL_CLASS =
  "flex w-full min-w-0 gap-3 overflow-x-auto overscroll-x-contain " +
  "pb-2 snap-x snap-mandatory";

/** Summary row: stacked on mobile; horizontal catalog on sm+. */
export const STORE_SUMMARY_ROW_CLASS =
  "flex w-full min-w-0 flex-col gap-3 sm:flex-row " +
  "sm:overflow-x-auto sm:overscroll-x-contain sm:pb-2 sm:snap-x sm:snap-mandatory";

/**
 * Card width is a fraction of the row so the next card is always clipped.
 * Mobile: one card + peek. Desktop: two or three cards + peek.
 */
export const STORE_CATALOG_CARD_WIDTH_CLASS =
  "w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[32%]";

/**
 * Summary cards (saved list, balances): full width on mobile; peek on larger screens.
 */
export const STORE_SUMMARY_CARD_WIDTH_CLASS =
  "w-full shrink-0 sm:w-[46%] sm:snap-start lg:w-[32%]";

export const STORE_AWARD_CARD_CLASS =
  `${STORE_CATALOG_CARD_WIDTH_CLASS} overflow-hidden rounded-2xl border bg-card`;

export const STORE_BALANCE_CARD_CLASS =
  `${STORE_SUMMARY_CARD_WIDTH_CLASS} relative overflow-hidden rounded-2xl ` +
  "bg-[var(--star-gold-muted)] p-4";

export const STORE_MY_LIST_CARD_CLASS =
  `${STORE_SUMMARY_CARD_WIDTH_CLASS} relative overflow-hidden rounded-2xl ` +
  "border bg-card p-4";

export const STORE_AWARD_IMAGE_FRAME_CLASS =
  "relative h-40 w-full overflow-hidden bg-white";

/** Clips watermark art to the card bounds (content-sized cards). */
export const STORE_CARD_WATERMARK_SLOT_CLASS =
  "pointer-events-none absolute inset-0 overflow-hidden";

/** Bottom-right watermark on summary cards (my list / balance). */
export const STORE_CARD_WATERMARK_IMAGE_CLASS =
  "absolute right-2 bottom-2 h-auto max-h-full w-auto object-contain " +
  "object-right-bottom";

export const STORE_BALANCE_LABEL_CLASS = "text-xs text-muted-foreground";

export const STORE_BALANCE_VALUE_CLASS =
  "text-lg font-semibold tabular-nums text-foreground";

/** Wider store shell on desktop; mobile stays `max-w-lg`. */
export const COLABORATOR_STORE_SURFACE_DESKTOP_WIDTH_CLASS =
  "md:max-w-4xl lg:max-w-6xl";
