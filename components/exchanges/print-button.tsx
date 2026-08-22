"use client";

import { useTranslations } from "next-intl";

import { PrintButton } from "@/components/ui/print-button";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";
import { buildExchangePrintPdfFilename } from "@/lib/exchanges/print-pdf-filename";

export function ExchangesPrintButton({
  batchId,
  month,
  year,
  labelKey,
  mode,
}: {
  batchId: string;
  month: number;
  year: number;
  labelKey: "printShopping" | "printDeliveries";
  mode: ExchangePrintKind;
}) {
  const t = useTranslations("exchanges");
  const pdfFilename = buildExchangePrintPdfFilename(mode, month, year);

  return (
    <PrintButton
      title={pdfFilename}
      onClick={() => {
        const previewUrl = `/exchanges/${batchId}/print/${mode}`;
        const previewWindow = window.open(
          previewUrl,
          "_blank",
          "noopener,noreferrer",
        );
        if (!previewWindow) {
          window.location.assign(previewUrl);
        }
        previewWindow?.focus();
      }}
    >
      {t(labelKey)}
    </PrintButton>
  );
}
