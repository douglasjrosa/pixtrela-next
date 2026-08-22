import { join } from "node:path";
import { getLocale, getTranslations } from "next-intl/server";

import { APP_PDF_LOGO_PNG } from "@/lib/assets/branding";
import type { ExchangeBatchDetail } from "@/lib/repos/exchange-batches";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";
import { formatMonthYear } from "@/lib/format/datetime";
import {
  generateDeliverySheetsPdf,
  generateShoppingListPdf,
  type DeliveryPdfLabels,
  type ShoppingListPdfLabels,
} from "@/lib/exchanges/generate-exchange-pdf";

async function buildShoppingLabels(
  detail: ExchangeBatchDetail,
): Promise<ShoppingListPdfLabels> {
  const t = await getTranslations("exchanges");
  const locale = await getLocale();
  return {
    title: t("shoppingList"),
    monthYearLabel: formatMonthYear(detail.month, detail.year, locale),
    logoPath: join(process.cwd(), "public", APP_PDF_LOGO_PNG.replace(/^\//, "")),
    itemColumn: t("shoppingList"),
    qtyColumn: t("qty"),
    unitValueColumn: t("unitValue"),
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
      await buildShoppingLabels(detail),
    );
  }

  return generateDeliverySheetsPdf(
    detail.deliveries,
    await buildDeliveryLabels(detail),
  );
}
