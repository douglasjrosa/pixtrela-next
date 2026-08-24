/** Netflix-style horizontal catalogs; the page itself scrolls vertically. */
export const STORE_PAGE_SHELL_CLASS = "space-y-6";

export const STORE_ROW_SCROLL_CLASS =
  "flex gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory";

export const STORE_AWARD_CARD_CLASS =
  "w-56 shrink-0 snap-start overflow-hidden rounded-2xl border bg-card";

export const STORE_BALANCE_CARD_CLASS =
  "relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl " +
  "bg-[var(--star-gold-muted)] p-4";

export const STORE_AWARD_IMAGE_FRAME_CLASS =
  "relative h-40 w-full overflow-hidden bg-muted";

export const STORE_BALANCE_BG_IMAGE_CLASS =
  "pointer-events-none absolute inset-0 size-full object-cover opacity-20";

export const STORE_BALANCE_LABEL_CLASS = "text-xs text-muted-foreground";

export const STORE_BALANCE_VALUE_CLASS =
  "text-lg font-semibold tabular-nums text-foreground";
