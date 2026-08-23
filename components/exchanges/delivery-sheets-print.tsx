import { getTranslations } from "next-intl/server";

import { ExchangesPrintButton } from "@/components/exchanges/print-button";
import { formatExchangeCurrencyLabel } from "@/lib/format/exchange-currency";
import type { BatchDeliveryOrder } from "@/lib/repos/exchange-batches";

function buildOrderSummaryParts(
  order: BatchDeliveryOrder,
  labels: {
    itemCount: string;
    prizeCount: string;
  },
): string[] {
  const totalPrizes = order.items.reduce((sum, item) => sum + item.qty, 0);
  return [
    labels.itemCount,
    labels.prizeCount,
    ...order.currencyRedemptions.map((redemption) =>
      formatExchangeCurrencyLabel(
        redemption.amount,
        redemption.currencyPluralTitle,
      ),
    ),
  ];
}

export async function DeliverySheetsPrint({
  deliveries,
  batchId,
  month,
  year,
}: {
  deliveries: BatchDeliveryOrder[];
  batchId: string;
  month: number;
  year: number;
}) {
  const t = await getTranslations("exchanges");

  return (
    <section className="exchanges-print-deliveries space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("deliveries")}</h2>
        <ExchangesPrintButton
          batchId={batchId}
          month={month}
          year={year}
          labelKey="printDeliveries"
          mode="deliveries"
        />
      </div>
      {deliveries.length === 0 ? (
        <p className="text-muted-foreground">{t("deliveriesEmpty")}</p>
      ) : (
        <div className="space-y-6">
          {deliveries.map((order) => {
            const lineItemCount = order.items.length;
            const totalPrizes = order.items.reduce(
              (sum, item) => sum + item.qty,
              0,
            );
            const summaryParts = buildOrderSummaryParts(order, {
              itemCount: t("itemCount", { count: lineItemCount }),
              prizeCount: t("prizeCount", { count: totalPrizes }),
            });

            return (
              <article
                key={order.orderId}
                className="space-y-4 rounded-xl border bg-muted/30 p-4"
              >
                <header className="space-y-1">
                  <h3 className="text-lg font-bold">{order.userName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {summaryParts.join(" · ")}
                  </p>
                </header>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3 font-semibold">
                        {t("exchangeList")}
                      </th>
                      <th className="py-2 px-3 text-center font-semibold">
                        {t("qty")}
                      </th>
                      <th className="py-2 px-3 text-center font-semibold">
                        {t("unit")}
                      </th>
                      <th className="py-2 text-center font-semibold">
                        {t("lineTotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={`${order.orderId}-${item.awardTitle}-${item.qty}-${item.unitNumberOf}`}
                        className="border-b border-border/60"
                      >
                        <td className="py-2 pr-3 align-middle">
                          {item.awardTitle}
                        </td>
                        <td className="py-2 pr-3 text-right align-middle tabular-nums">
                          {item.qty}
                        </td>
                        <td className="py-2 pr-3 text-right align-middle tabular-nums">
                          {formatExchangeCurrencyLabel(
                            item.unitNumberOf,
                            item.currencyPluralTitle,
                          )}
                        </td>
                        <td className="py-2 text-right align-middle tabular-nums">
                          {formatExchangeCurrencyLabel(
                            item.lineNumberOf,
                            item.currencyPluralTitle,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
