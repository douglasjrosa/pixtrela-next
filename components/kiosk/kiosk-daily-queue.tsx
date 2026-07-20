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
  flashDocumentId?: string | null;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
}

export function KioskDailyQueue({
  subTasks,
  readOnly = false,
  pending,
  flashDocumentId,
  onStart,
  onExit,
}: KioskDailyQueueProps) {
  const t = useTranslations("kiosk");
  const sections = splitKioskQueueSections(subTasks);

  if (subTasks.length === 0) {
    return (
      <p role="status" className="px-4 py-8 text-center text-lg">
        {t("noTasks")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-4 py-4">
      {sections.producing.length > 0 ? (
        <section aria-labelledby="kiosk-section-producing">
          <h2
            className="mb-3 text-xl font-semibold"
            id="kiosk-section-producing"
          >
            {t("sectionProducing")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.producing}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
            highlightProducing
          />
        </section>
      ) : null}

      {sections.pending.length > 0 ? (
        <section aria-labelledby="kiosk-section-pending">
          <h2 className="mb-3 text-xl font-semibold" id="kiosk-section-pending">
            {t("sectionPending")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.pending}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
          />
        </section>
      ) : null}

      {sections.finishedToday.length > 0 ? (
        <section aria-labelledby="kiosk-section-finished">
          <h2
            className="mb-3 text-xl font-semibold"
            id="kiosk-section-finished"
          >
            {t("sectionFinishedToday")}
          </h2>
          <KioskSubtaskPanel
            subTasks={sections.finishedToday}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
          />
        </section>
      ) : null}
    </div>
  );
}
