import { getTranslations } from "next-intl/server";

import type { ExchangeBatchDetail } from "@/lib/repos/exchange-batches";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";
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

async function buildDeliveryLabels(): Promise<DeliveryPdfLabels> {
  const t = await getTranslations("exchanges");
  return {
    sectionTitle: t("deliveries"),
    itemColumn: t("exchangeList"),
    qtyColumn: t("qty"),
    unitColumn: t("unit"),
    lineTotalColumn: t("lineTotal"),
    signature: t("signature"),
    dateLine: t("dateLine"),
    formatItemCount: (count: number) => t("itemCount", { count }),
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
    await buildDeliveryLabels(),
  );
}
