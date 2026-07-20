"use client";

import { useTranslations } from "next-intl";

import { CurrencyMediaIcon } from "@/components/currency/currency-media-icon";
import { Duration } from "@/components/ui/duration";
import { StackedDateTime } from "@/components/ui/stacked-date-time";
import {
  calculateColaboratorEarnings,
  calculateParticipationPercent,
} from "@/lib/business/subtask-payment";
import {
  aggregateSessionTotals,
  type ActivitySession,
  type SharingType,
} from "@/lib/business/task-progress";
import type { SubtaskPaymentCurrency } from "@/lib/strapi/currency-for-subtasks";

export interface SubTaskSessionsPanelProps {
  sessions: ActivitySession[];
  sharingType: SharingType;
  expectedTime?: number;
  timeSpent?: number;
  paymentCurrency?: SubtaskPaymentCurrency | null;
  /** When true, totals appear above the sessions table (info modal). */
  totalsFirst?: boolean;
}

export function SubTaskSessionsPanel({
  sessions,
  sharingType,
  expectedTime = 0,
  timeSpent = 0,
  paymentCurrency = null,
  totalsFirst = false,
}: SubTaskSessionsPanelProps) {
  const t = useTranslations("subtasks");
  const totals = aggregateSessionTotals(sessions);
  const totalDurationSec = totals.reduce(
    (sum, row) => sum + row.totalDurationSec,
    0,
  );
  const totalQty = totals.reduce((sum, row) => sum + row.totalQty, 0);
  const currencyPerSecond = paymentCurrency?.currencyPerSecond ?? 0;
  const iconUrl = paymentCurrency?.iconUrl ?? null;

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("sessionsEmpty")}
      </p>
    );
  }

  const sessionsSection = (
    <div>
      <h3 className="mb-2 text-sm font-medium">{t("sessionsTitle")}</h3>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 font-medium">{t("sessionWho")}</th>
              <th className="px-2 py-1.5 font-medium">{t("sessionStart")}</th>
              <th className="px-2 py-1.5 font-medium">{t("sessionEnd")}</th>
              <th className="px-2 py-1.5 font-medium">{t("sessionDuration")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={`${session.colaboratorDocumentId}-${session.startedAt}`}
                className="border-b last:border-0"
              >
                <td className="px-2 py-1.5">
                  {session.colaboratorName || "—"}
                </td>
                <td className="px-2 py-1.5">
                  <StackedDateTime value={session.startedAt} />
                </td>
                <td className="px-2 py-1.5">
                  <StackedDateTime value={session.finishedAt} />
                </td>
                <td className="px-2 py-1.5 tabular-nums">
                  <Duration seconds={session.durationSec} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const totalsSection = (
    <div>
      <h3 className="mb-2 text-sm font-medium">{t("sessionTotalsTitle")}</h3>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 font-medium">{t("totalName")}</th>
              <th className="px-2 py-1.5 font-medium">{t("totalEarnings")}</th>
              <th className="px-2 py-1.5 font-medium">
                {t("totalParticipation")}
              </th>
              <th className="px-2 py-1.5 font-medium">{t("totalDuration")}</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((total) => {
              const earnings = calculateColaboratorEarnings({
                sharingType,
                colaboratorDurationSec: total.totalDurationSec,
                colaboratorQty: total.totalQty,
                totalDurationSec,
                totalQty,
                expectedTime,
                currencyPerSecond,
              });
              const participation = calculateParticipationPercent(
                total.totalDurationSec,
                timeSpent,
              );

              return (
                <tr
                  key={total.colaboratorDocumentId}
                  className="border-b last:border-0"
                >
                  <td className="px-2 py-1.5">
                    {total.colaboratorName || "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
                      <CurrencyMediaIcon url={iconUrl} className="size-3.5" />
                      <span>{earnings}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                    {t("participationPercent", { percent: participation })}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                    <Duration seconds={total.totalDurationSec} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {totalsFirst ? (
        <>
          {totalsSection}
          {sessionsSection}
        </>
      ) : (
        <>
          {sessionsSection}
          {totalsSection}
        </>
      )}
    </div>
  );
}
