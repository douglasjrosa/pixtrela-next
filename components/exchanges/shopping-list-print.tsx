import { getTranslations } from "next-intl/server";

import { ExchangesPrintButton } from "@/components/exchanges/print-button";
import type { BatchShoppingLine } from "@/lib/repos/exchange-batches";

import "./exchanges-print.css";

export async function ShoppingListPrint({
  lines,
  batchId,
  month,
  year,
  preview = false,
}: {
  lines: BatchShoppingLine[];
  batchId?: string;
  month?: number;
  year?: number;
  preview?: boolean;
}) {
  const t = await getTranslations("exchanges");

  return (
    <section className="exchanges-print-shopping space-y-4">
      {preview ? (
        <h2 className="text-xl font-bold">{t("shoppingList")}</h2>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t("shoppingList")}</h2>
          {batchId != null && month != null && year != null ? (
            <ExchangesPrintButton
              batchId={batchId}
              month={month}
              year={year}
              labelKey="printShopping"
              mode="shopping"
            />
          ) : null}
        </div>
      )}
      {lines.length === 0 ? (
        <p className="text-muted-foreground">{t("shoppingEmpty")}</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 font-semibold">{t("shoppingList")}</th>
              <th className="py-2 text-right font-semibold">{t("qty")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr
                key={line.awardId ?? line.awardTitle}
                className="border-b border-border/60"
              >
                <td className="py-2 pr-3">{line.awardTitle}</td>
                <td className="py-2 text-right tabular-nums">{line.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
