"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { appQueueColaboratorPath } from "@/lib/business/app-queues-paths";
import { formatActivitySubtaskDisplayLabel } from "@/lib/business/activity-subtask-label";
import { staffQueueColaboratorPath } from "@/lib/business/kiosk-staff-paths";
import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import type { StaffQueueTeam } from "@/lib/kiosk/load-staff-queues-grouped";
import { cn } from "@/lib/utils";

function activityActionBadgeClass(action: "started" | "stoped"): string {
  return action === "started" ? "bg-green-600" : "bg-red-600";
}

export type StaffQueuesColaboratorLinkTarget = "app" | "kiosk";

export interface KioskStaffQueuesPanelProps {
  teams: StaffQueueTeam[];
  /** Web app `/queues/[id]` links. Default kiosk staff route when omitted. */
  colaboratorLinkTarget?: StaffQueuesColaboratorLinkTarget;
  /** Required when `colaboratorLinkTarget` is `"kiosk"` (default). */
  userId?: string;
}

function resolveColaboratorHref(
  linkTarget: StaffQueuesColaboratorLinkTarget,
  userId: string | undefined,
  colaboratorId: string,
): string {
  if (linkTarget === "app") {
    return appQueueColaboratorPath(colaboratorId);
  }
  if (!userId) {
    throw new Error("userId is required for kiosk staff queue links");
  }
  return staffQueueColaboratorPath(userId, colaboratorId);
}

/** Staff view: active teams with their colaborators as queue entries. */
export function KioskStaffQueuesPanel({
  userId,
  teams,
  colaboratorLinkTarget = "kiosk",
}: KioskStaffQueuesPanelProps) {
  const t = useTranslations("kiosk");
  const tActivities = useTranslations("activities");

  if (teams.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("queuesEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <section key={team.teamId} className="space-y-2">
          <h2 className="text-lg font-semibold">
            {t("queuesTeamHeading", { name: team.teamName })}
          </h2>
          {team.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("staffUsersEmpty")}
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border">
              {team.members.map((member) => {
                const lastActivityLabel = member.lastActivity
                  ? formatActivitySubtaskDisplayLabel({
                      subTaskName: member.lastActivity.subTaskName,
                      taskQty: member.lastActivity.taskQty,
                      taskName: member.lastActivity.taskName,
                      taskCrmItemKey: member.lastActivity.taskCrmItemKey,
                      taskDeliveryDate: member.lastActivity.taskDeliveryDate,
                    })
                  : null;
                const actionLabel = member.lastActivity
                  ? member.lastActivity.action === "started"
                    ? tActivities("action.started")
                    : tActivities("action.stoped")
                  : "";

                return (
                  <li
                    key={`${team.teamId}:${member.documentId}`}
                    className="border-b last:border-b-0"
                  >
                    <Link
                      href={resolveColaboratorHref(
                        colaboratorLinkTarget,
                        userId,
                        member.documentId,
                      )}
                      className={cn(
                        "flex min-h-12 items-center gap-3 px-3 py-2 text-left",
                        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2",
                      )}
                    >
                      <div
                        className={cn(
                          "flex shrink-0 flex-row flex-wrap items-center gap-2",
                          "max-md:flex-col max-md:items-start max-md:gap-1",
                        )}
                      >
                        <span className="whitespace-nowrap font-medium">
                          {member.name}
                          <span className="tabular-nums font-normal text-muted-foreground">
                            {" "}
                            {member.code ?? "—"}
                          </span>
                        </span>
                        {member.lastActivity && lastActivityLabel ? (
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-xs font-medium",
                              "tabular-nums text-white",
                              activityActionBadgeClass(
                                member.lastActivity.action,
                              ),
                            )}
                            aria-label={actionLabel}
                          >
                            {formatActivityDateTimePtBr(
                              member.lastActivity.timestamp,
                            )}
                          </span>
                        ) : null}
                      </div>
                      {member.lastActivity && lastActivityLabel ? (
                        <span
                          className={cn(
                            "min-w-0 flex-1 break-words text-right text-sm",
                            "text-muted-foreground",
                          )}
                        >
                          {lastActivityLabel}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
