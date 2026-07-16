"use client";

import { useTranslations } from "next-intl";

import { Duration } from "@/components/ui/duration";
import {
  aggregateSessionTotals,
  type ActivitySession,
  type SharingType,
} from "@/lib/business/task-progress";
import { formatDateTimePtBr } from "@/lib/format/datetime";

export interface SubTaskSessionsPanelProps {
  sessions: ActivitySession[];
  sharingType: SharingType;
}

export function SubTaskSessionsPanel({
  sessions,
  sharingType,
}: SubTaskSessionsPanelProps) {
  const t = useTranslations("subtasks");
  const totals = aggregateSessionTotals(sessions);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("sessionsEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
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
                  <td className="px-2 py-1.5 tabular-nums">
                    {formatDateTimePtBr(session.startedAt)}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {formatDateTimePtBr(session.finishedAt)}
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

      <div>
        <h3 className="mb-2 text-sm font-medium">{t("sessionTotalsTitle")}</h3>
        <ul className="space-y-1 text-sm">
          {totals.map((total) => (
            <li
              key={total.colaboratorDocumentId}
              className="flex items-center justify-between gap-2"
            >
              <span>{total.colaboratorName || "—"}</span>
              <span className="tabular-nums text-muted-foreground">
                {sharingType === "qty" ? (
                  t("sessionTotalQty", { qty: total.totalQty })
                ) : (
                  <Duration seconds={total.totalDurationSec} />
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
