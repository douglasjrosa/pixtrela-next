"use client";

import { useTranslations } from "next-intl";

import {
  buildKioskQueueUnits,
  splitQueueUnitsBySection,
  type OpenChainRun,
} from "@/lib/business/kiosk-queue-units";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskSubtaskPanel } from "./kiosk-subtask-panel";

export interface KioskDailyQueueProps {
  colaboratorId: string;
  subTasks: KioskSubTask[];
  catalog?: KioskSubTask[];
  openRuns?: readonly OpenChainRun[];
  readOnly?: boolean;
  pending?: boolean;
  flashDocumentId?: string | null;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  onStartChain?: (headId: string) => void | Promise<void>;
  onConfirmChainStop?: (
    chainRunId: string,
    answers: ChainStopAnswer[],
  ) => void | Promise<void>;
  onAdvanceChain?: (chainRunId: string) => void | Promise<void>;
}

export function KioskDailyQueue({
  colaboratorId,
  subTasks,
  catalog,
  openRuns,
  readOnly = false,
  pending,
  flashDocumentId,
  onStart,
  onExit,
  onStartChain,
  onConfirmChainStop,
  onAdvanceChain,
}: KioskDailyQueueProps) {
  const t = useTranslations("kiosk");
  const units = buildKioskQueueUnits({
    viewerId: colaboratorId,
    subTasks,
    allTaskSubTasks: catalog,
    openRuns,
  });
  const sections = splitQueueUnitsBySection(units);

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
            units={sections.producing}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
            onStartChain={onStartChain}
            onConfirmChainStop={onConfirmChainStop}
            onAdvanceChain={onAdvanceChain}
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
            units={sections.pending}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
            onStartChain={onStartChain}
            onConfirmChainStop={onConfirmChainStop}
            onAdvanceChain={onAdvanceChain}
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
            units={sections.finishedToday}
            allSubTasks={subTasks}
            readOnly={readOnly}
            pending={pending}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
            onStartChain={onStartChain}
            onConfirmChainStop={onConfirmChainStop}
            onAdvanceChain={onAdvanceChain}
          />
        </section>
      ) : null}
    </div>
  );
}
