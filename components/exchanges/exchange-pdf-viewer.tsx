"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { BackLink } from "@/components/navigation/back-link";
import { PrintButton } from "@/components/ui/print-button";
import type { ExchangePrintKind } from "@/lib/exchanges/print-pdf-filename";

import "./exchange-pdf-viewer.css";

type ExchangePdfViewerProps = {
  batchId: string;
  kind: ExchangePrintKind;
  pdfFilename: string;
  backHref: string;
};

export function ExchangePdfViewer({
  batchId,
  kind,
  pdfFilename,
  backHref,
}: ExchangePdfViewerProps) {
  const t = useTranslations("exchanges");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileUrl = `/exchanges/${batchId}/pdf/file?kind=${kind}`;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = pdfFilename.replace(/\.pdf$/i, "");
    document.body.dataset.exchangePdfViewer = "true";

    return () => {
      document.title = previousTitle;
      delete document.body.dataset.exchangePdfViewer;
    };
  }, [pdfFilename]);

  function handlePrint(): void {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;
    frameWindow.focus();
    frameWindow.print();
  }

  return (
    <section className="exchange-pdf-viewer flex min-h-[70vh] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href={backHref}>{t("backToList")}</BackLink>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{pdfFilename}</p>
          <PrintButton onClick={handlePrint}>{t("printDocument")}</PrintButton>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title={pdfFilename}
        src={fileUrl}
        className="min-h-[70vh] w-full flex-1 rounded-xl border bg-white"
      />
    </section>
  );
}
