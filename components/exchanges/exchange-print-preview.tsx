"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { PrintButton } from "@/components/ui/print-button";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";

import "./exchanges-print.css";

const PRINT_MODE_ATTR = "data-exchanges-print";
const PREVIEW_ATTR = "data-exchange-print-preview";

export function ExchangePrintPreview({
  mode,
  pdfFilename,
  children,
}: {
  mode: ExchangePrintKind;
  pdfFilename: string;
  children: ReactNode;
}) {
  const t = useTranslations("exchanges");

  useEffect(() => {
    const previousTitle = document.title;
    document.body.setAttribute(PRINT_MODE_ATTR, mode);
    document.body.setAttribute(PREVIEW_ATTR, "true");
    document.title = pdfFilename.replace(/\.pdf$/i, "");

    return () => {
      document.body.removeAttribute(PRINT_MODE_ATTR);
      document.body.removeAttribute(PREVIEW_ATTR);
      document.title = previousTitle;
    };
  }, [mode, pdfFilename]);

  return (
    <div className="exchange-print-preview mx-auto max-w-4xl p-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{pdfFilename}</p>
        <PrintButton onClick={() => window.print()}>
          {t("printDocument")}
        </PrintButton>
      </div>
      {children}
    </div>
  );
}
