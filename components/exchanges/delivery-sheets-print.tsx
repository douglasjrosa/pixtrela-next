import { getTranslations } from "next-intl/server";

import { ExchangesPrintButton } from "@/components/exchanges/print-button";
import type { BatchDeliveryOrder } from "@/lib/repos/exchange-batches";

import "./exchanges-print.css";

export async function DeliverySheetsPrint({
  deliveries,
}: {
  deliveries: BatchDeliveryOrder[];
}) {
  const t = await getTranslations("exchanges");

  return (
    <section className="exchanges-print-deliveries space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("deliveries")}</h2>
        <ExchangesPrintButton labelKey="printDeliveries" mode="deliveries" />
      </div>
      {deliveries.length === 0 ? (
        <p className="text-muted-foreground">{t("deliveriesEmpty")}</p>
      ) : (
        <div className="exchanges-print-delivery-cards space-y-8">
          {deliveries.map((order) => (
            <article
              key={order.orderId}
              className="exchanges-print-delivery-card space-y-4 rounded-xl border p-4"
            >
              <header className="space-y-1">
                <h3 className="text-lg font-bold">{order.userName}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("itemCount", { count: order.itemCount })} · {t("total")}:{" "}
                  <span className="tabular-nums font-semibold text-foreground">
                    {order.totalNumberOf} {order.currencyPluralTitle}
                  </span>
                </p>
              </header>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-semibold">
                      {t("shoppingList")}
                    </th>
                    <th className="py-2 pr-3 text-right font-semibold">
                      {t("qty")}
                    </th>
                    <th className="py-2 pr-3 text-right font-semibold">
                      {t("unit")}
                    </th>
                    <th className="py-2 text-right font-semibold">
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
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {item.qty}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {item.unitNumberOf}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {item.lineNumberOf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="print-only grid gap-6 pt-8 sm:grid-cols-2">
                <p className="border-b border-foreground/40 pb-1 text-sm">
                  {t("signature")}: ________________________
                </p>
                <p className="border-b border-foreground/40 pb-1 text-sm">
                  {t("dateLine")}: ____ / ____ / ________
                </p>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
