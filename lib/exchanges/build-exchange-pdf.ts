import { getLocale, getTranslations } from "next-intl/server";

import type { ExchangeBatchDetail } from "@/lib/repos/exchange-batches";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";
import { formatMonthYear } from "@/lib/format/datetime";
import {
  generateDeliverySheetsPdf,
  generateShoppingListPdf,
  type DeliveryPdfLabels,
  type ShoppingListPdfLabels,
} from "@/lib/exchanges/generate-exchange-pdf";

async function buildShoppingLabels(): Promise<ShoppingListPdfLabels> {
  const t = await getTranslations("exchanges");
  return {
    title: t("shoppingList"),
    itemColumn: t("shoppingList"),
    qtyColumn: t("qty"),
  };
}

async function buildDeliveryLabels(
  detail: ExchangeBatchDetail,
): Promise<DeliveryPdfLabels> {
  const t = await getTranslations("exchanges");
  const locale = await getLocale();
  return {
    monthYearLabel: formatMonthYear(detail.month, detail.year, locale),
    itemColumn: t("exchangeList"),
    qtyColumn: t("qty"),
    unitColumn: t("unit"),
    lineTotalColumn: t("lineTotal"),
    signature: t("signature"),
    dateLine: t("dateLine"),
    formatOrderSummary: (itemCount: number, totalQty: number) =>
      `${t("itemCount", { count: itemCount })}, ${t("totalUnits", { count: totalQty })}`,
  };
}

export async function buildExchangePdfBuffer(
  detail: ExchangeBatchDetail,
  kind: ExchangePrintKind,
): Promise<Buffer> {
  if (kind === "shopping") {
    return generateShoppingListPdf(
      detail.shoppingList,
      await buildShoppingLabels(),
    );
  }

  return generateDeliverySheetsPdf(
    detail.deliveries,
    await buildDeliveryLabels(detail),
  );
}
