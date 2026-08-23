import { getTranslations } from "next-intl/server";

import { ExchangesPrintButton } from "@/components/exchanges/print-button";
import type { BatchDeliveryOrder } from "@/lib/repos/exchange-batches";

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
        <div className="space-y-8">
          {deliveries.map((order) => (
            <article
              key={order.orderId}
              className="space-y-4 rounded-xl border p-4"
            >
              <header className="space-y-1">
                <h3 className="text-lg font-bold">{order.userName}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("itemCount", { count: order.itemCount })} ·{" "}
                  <span className="tabular-nums font-semibold text-foreground">
                    {order.totalNumberOf} {order.currencyPluralTitle}
                  </span>
                </p>
              </header>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-semibold">
                      {t("exchangeList")}
                    </th>
                    <th className="py-2 pr-3 text-center font-semibold">
                      {t("qty")}
                    </th>
                    <th className="py-2 pr-3 text-center font-semibold">
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
                      key={`${order.orderId}-${item.awardTitle}-${item.qty}`}
                      className="border-b border-border/60"
                    >
                      <td className="py-2 pr-3">{item.awardTitle}</td>
                      <td className="py-2 pr-3 text-center align-middle tabular-nums">
                        {item.qty}
                      </td>
                      <td className="py-2 pr-3 text-center align-middle tabular-nums">
                        {item.unitNumberOf}
                      </td>
                      <td className="py-2 text-center align-middle tabular-nums">
                        {item.lineNumberOf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
