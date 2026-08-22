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
        const pdfUrl = `/exchanges/${batchId}/pdf?kind=${mode}`;
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }}
    >
      {t(labelKey)}
    </PrintButton>
  );
}
