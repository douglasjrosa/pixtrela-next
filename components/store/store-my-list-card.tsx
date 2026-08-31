import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AppImage } from "@/components/media/app-image";
import { CardWatermarkImage } from "@/components/store/card-watermark-image";
import {
  resolveBrandingBackgroundStyle,
  resolveCartWatermarkStyle,
  type BrandingSlotConfig,
} from "@/lib/domain/branding-slots";
import { formatExchangeCurrencyLabel } from "@/lib/format/exchange-currency";
import type { SavedCartListItem } from "@/lib/store/list-saved-cart-items";
import {
  STORE_MY_LIST_CARD_CLASS,
} from "@/lib/store/store-layout";
import { cn } from "@/lib/utils";

const MY_LIST_GRID_CLASS =
  "mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-3";
const MY_LIST_ROW_CLASS = "contents";
const MY_LIST_ROW_IMAGE_CLASS =
  "relative size-[3.325rem] shrink-0 justify-self-center overflow-hidden rounded-lg bg-muted";
const MY_LIST_QTY_CLASS =
  "justify-self-end text-right text-[1.675rem] leading-none font-semibold " +
  "tabular-nums text-muted-foreground";
const MY_LIST_DETAILS_CLASS = "min-w-0 justify-self-start space-y-1";
const MY_LIST_TITLE_CLASS =
  "truncate text-[1.16rem] font-bold leading-tight";
const MY_LIST_PRICE_CLASS =
  "flex items-center gap-1.5 text-[1rem] font-bold leading-tight text-primary";
const MY_LIST_CURRENCY_ICON_CLASS =
  "size-[1.16rem] shrink-0 object-contain";

export type StoreMyListCardWatermark = {
  url: string | null;
  backgroundColor?: string | null;
  backgroundColorOpacity?: number;
  displayOpacity?: number;
  widthPercent?: number;
};

export type StoreMyListCardProps = {
  items: SavedCartListItem[];
  cartWatermark?: StoreMyListCardWatermark;
};

export async function StoreMyListCard({
  items,
  cartWatermark,
}: StoreMyListCardProps) {
  const t = await getTranslations("cart");
  const slotConfig = {
    backgroundColor: cartWatermark?.backgroundColor,
    backgroundColorOpacity: cartWatermark?.backgroundColorOpacity,
    displayOpacity: cartWatermark?.displayOpacity,
    widthPercent: cartWatermark?.widthPercent,
  } satisfies BrandingSlotConfig;
  const watermarkUrl = cartWatermark?.url ?? null;
  const watermarkStyle = resolveCartWatermarkStyle(slotConfig);
  const cardBackground = resolveBrandingBackgroundStyle(slotConfig);

  return (
    <li
      className={cn(STORE_MY_LIST_CARD_CLASS, cardBackground && "bg-transparent")}
      data-testid="store-my-list-card"
      style={cardBackground ? { backgroundColor: cardBackground } : undefined}
    >
      {watermarkUrl ? (
        <CardWatermarkImage
          src={watermarkUrl}
          widthPercent={watermarkStyle.widthPercent}
          opacity={watermarkStyle.opacity}
          testId="store-my-list-watermark"
        />
      ) : null}
      <div className="relative z-10">
        <h2 className="font-heading text-sm font-semibold">{t("myList")}</h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("myListEmpty")}</p>
        ) : (
          <ul className={MY_LIST_GRID_CLASS} aria-label={t("myList")}>
            {items.flatMap((item) =>
              item.lines.map((line) => (
                <li
                  key={`${item.awardId}-${line.currencyId}`}
                  className={MY_LIST_ROW_CLASS}
                >
                  <span className={MY_LIST_QTY_CLASS} aria-hidden>
                    <span className="text-primary">{line.qty}</span>
                    <span>&nbsp;x</span>
                  </span>
                  <div className={MY_LIST_ROW_IMAGE_CLASS}>
                    {item.imageUrl ? (
                      <AppImage
                        src={item.imageUrl}
                        fill
                        sizes="3.5rem"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Package
                          className="size-[1.33rem] text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                  <div className={MY_LIST_DETAILS_CLASS}>
                    <p className={MY_LIST_TITLE_CLASS}>{item.title}</p>
                    <p className={MY_LIST_PRICE_CLASS}>
                      {line.iconUrl ? (
                        <AppImage
                          src={line.iconUrl}
                          width={19}
                          height={19}
                          className={MY_LIST_CURRENCY_ICON_CLASS}
                        />
                      ) : null}
                      <span>
                        {formatExchangeCurrencyLabel(line.unitCost * line.qty, {
                          title: line.label,
                          pluralTitle: line.label,
                        })}
                      </span>
                    </p>
                  </div>
                </li>
              )),
            )}
          </ul>
        )}
      </div>
    </li>
  );
}
