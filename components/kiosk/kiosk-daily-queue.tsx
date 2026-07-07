"use client";

import { useTranslations } from "next-intl";

import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { splitKioskQueueSections } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskSubtaskPanel } from "./kiosk-subtask-panel";

export interface KioskDailyQueueProps {
  subTasks: KioskSubTask[];
  readOnly?: boolean;
  pending?: boolean;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
}

export function KioskDailyQueue({
  subTasks,
  readOnly = false,
  pending,
  onStart,
  onExit,
}: KioskDailyQueueProps) {
  const t = useTranslations("kiosk");
  const sections = splitKioskQueueSections(subTasks);

  if (subTasks.length === 0) {
    return <p role="status">{t("noTasks")}</p>;
  }

  return (
    <div className="space-y-8">
      {sections.producing.length > 0 ? (
        <section aria-labelledby="kiosk-section-producing">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            id="kiosk-section-producing"
          >
            {t("sectionProducing")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.producing}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            onStart={onStart}
            onExit={onExit}
            highlightProducing
          />
        </section>
      ) : null}

      {sections.pending.length > 0 ? (
        <section aria-labelledby="kiosk-section-pending">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            id="kiosk-section-pending"
          >
            {t("sectionPending")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.pending}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            onStart={onStart}
            onExit={onExit}
          />
        </section>
      ) : null}

      {sections.finishedToday.length > 0 ? (
        <section aria-labelledby="kiosk-section-finished">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            id="kiosk-section-finished"
          >
            {t("sectionFinishedToday")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.finishedToday}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            onStart={onStart}
            onExit={onExit}
          />
        </section>
      ) : null}
    </div>
  );
}
