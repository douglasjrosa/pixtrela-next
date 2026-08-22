export type ExchangePrintKind = "shopping" | "deliveries";

export function buildExchangePrintPdfFilename(
  kind: ExchangePrintKind,
  month: number,
  year: number,
): string {
  const monthPart = String(month).padStart(2, "0");
  const prefix =
    kind === "shopping" ? "lista-de-compras" : "lista-de-trocas";
  return `${prefix}-${monthPart}-${year}.pdf`;
}

export function isExchangePrintKind(value: string): value is ExchangePrintKind {
  return value === "shopping" || value === "deliveries";
}
