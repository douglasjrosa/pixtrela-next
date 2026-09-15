import Link from "next/link";
import { useTranslations } from "next-intl";

import { staffQueueColaboratorPath } from "@/lib/business/kiosk-staff-paths";
import type { StaffQueueTeam } from "@/lib/kiosk/load-staff-queues-grouped";
import { cn } from "@/lib/utils";

export interface KioskStaffQueuesPanelProps {
  teams: StaffQueueTeam[];
  /** Kiosk staff route — requires userId when colaboratorHref is omitted. */
  userId?: string;
  colaboratorHref?: (colaboratorId: string) => string;
}

function resolveColaboratorHref(
  userId: string | undefined,
  colaboratorHref: ((colaboratorId: string) => string) | undefined,
  colaboratorId: string,
): string {
  if (colaboratorHref) {
    return colaboratorHref(colaboratorId);
  }
  if (!userId) {
    throw new Error("userId or colaboratorHref is required");
  }
  return staffQueueColaboratorPath(userId, colaboratorId);
}

/** Staff view: active teams with their colaborators as queue entries. */
export function KioskStaffQueuesPanel({
  userId,
  teams,
  colaboratorHref,
}: KioskStaffQueuesPanelProps) {
  const t = useTranslations("kiosk");

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
              {team.members.map((member) => (
                <li
                  key={`${team.teamId}:${member.documentId}`}
                  className="border-b last:border-b-0"
                >
                  <Link
                    href={resolveColaboratorHref(
                      userId,
                      colaboratorHref,
                      member.documentId,
                    )}
                    className={cn(
                      "flex min-h-12 items-center justify-between gap-4 px-3 py-2",
                      "text-left hover:bg-muted/40 focus-visible:outline-none",
                      "focus-visible:ring-2",
                    )}
                  >
                    <span className="truncate">{member.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {member.code ?? "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
