"use client";

import { useTranslations } from "next-intl";

import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { DEFAULT_ASSIGN_WARN_MAX } from "@/lib/business/assign-warn-max";
import { appQueueColaboratorPath } from "@/lib/business/app-queues-paths";
import { staffQueueColaboratorPath } from "@/lib/business/kiosk-staff-paths";
import type { StaffQueueTeam } from "@/lib/kiosk/load-staff-queues-grouped";
import { cn } from "@/lib/utils";

import { StaffQueueMemberRow } from "./staff-queue-member-row";

export type StaffQueuesColaboratorLinkTarget = "app" | "kiosk";

export interface KioskStaffQueuesPanelProps {
  teams: StaffQueueTeam[];
  /** Web app `/queues/[id]` links. Default kiosk staff route when omitted. */
  colaboratorLinkTarget?: StaffQueuesColaboratorLinkTarget;
  /** Required when `colaboratorLinkTarget` is `"kiosk"` (default). */
  userId?: string;
  assignWarnMax?: number;
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
  assignWarnMax = DEFAULT_ASSIGN_WARN_MAX,
}: KioskStaffQueuesPanelProps) {
  const t = useTranslations("kiosk");

  if (teams.length === 0) {
    return (
      <section className={APP_LIST_PAGE_SHELL_CLASS}>
        <p role="status" className="text-sm text-muted-foreground">
          {t("queuesEmpty")}
        </p>
      </section>
    );
  }

  return (
    <section className={cn(APP_LIST_PAGE_SHELL_CLASS, "min-h-0")}>
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
              {team.members.map((member) => (
                <li
                  key={`${team.teamId}:${member.documentId}`}
                  className="border-b last:border-b-0"
                >
                  <StaffQueueMemberRow
                    member={member}
                    assignWarnMax={assignWarnMax}
                    href={resolveColaboratorHref(
                      colaboratorLinkTarget,
                      userId,
                      member.documentId,
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
    </section>
  );
}
