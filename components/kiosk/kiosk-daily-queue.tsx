"use client";

import { useTranslations } from "next-intl";

import type {
  KioskQueueUnit,
  OpenChainRun,
} from "@/lib/business/kiosk-queue-units";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskQueueLoadMoreSentinel } from "./kiosk-queue-load-more-sentinel";
import { KioskQueueSectionAccordion } from "./kiosk-queue-section-accordion";
import { KioskQueueSkeletonList } from "./kiosk-queue-card-skeleton";
import { KioskSubtaskPanel } from "./kiosk-subtask-panel";

export type KioskSectionState = {
  producingUnits: KioskQueueUnit[];
  units: KioskQueueUnit[];
  nextCursor: string | null;
  hasMore: boolean;
  expanded: boolean;
  loading: boolean;
  loadedOnce: boolean;
};

export interface KioskDailyQueueProps {
  colaboratorId: string;
  liberadas: KioskSectionState;
  bloqueadas: KioskSectionState;
  finalizadas: KioskSectionState;
  allSubTasks: KioskSubTask[];
  openRuns?: readonly OpenChainRun[];
  readOnly?: boolean;
  flashDocumentId?: string | null;
  blockingUi?: boolean;
  timerPaused?: boolean;
  exitBusy?: boolean;
  onLoadMoreLiberadas: () => void;
  onToggleBloqueadas: () => void;
  onLoadMoreBloqueadas: () => void;
  onToggleFinalizadas: () => void;
  onLoadMoreFinalizadas: () => void;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  onStartChain?: (headId: string) => void | Promise<void>;
  onConfirmChainStop?: (
    chainRunId: string,
    answers: ChainStopAnswer[],
  ) => void | Promise<void>;
  onAdvanceChain?: (chainRunId: string) => void | Promise<void>;
  onReleaseMaterialFlag?: (flagId: string) => void | Promise<void>;
  onRefreshMaterialFlags?: (
    subTaskId: string,
  ) => Promise<{
    flags: Array<{ id: string; code: string }>;
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  }>;
  onChainRunNotReady?: () => void;
}

function sectionIsEmpty(section: KioskSectionState): boolean {
  return (
    section.producingUnits.length === 0 &&
    section.units.length === 0 &&
    !section.hasMore &&
    !section.loading
  );
}

export function KioskDailyQueue({
  liberadas,
  bloqueadas,
  finalizadas,
  allSubTasks,
  openRuns,
  readOnly = false,
  blockingUi = false,
  timerPaused,
  exitBusy = false,
  flashDocumentId,
  onLoadMoreLiberadas,
  onToggleBloqueadas,
  onLoadMoreBloqueadas,
  onToggleFinalizadas,
  onLoadMoreFinalizadas,
  onStart,
  onExit,
  onStartChain,
  onConfirmChainStop,
  onAdvanceChain,
  onReleaseMaterialFlag,
  onRefreshMaterialFlags,
  onChainRunNotReady,
}: KioskDailyQueueProps) {
  const t = useTranslations("kiosk");
  const liberadasUnits = [...liberadas.producingUnits, ...liberadas.units];
  const queueEmpty =
    sectionIsEmpty(liberadas) &&
    !bloqueadas.loadedOnce &&
    !finalizadas.loadedOnce &&
    sectionIsEmpty(bloqueadas) &&
    sectionIsEmpty(finalizadas);

  if (queueEmpty) {
    return (
      <p role="status" className="px-4 py-8 text-center text-lg">
        {t("noTasks")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-4 py-4">
      <section aria-labelledby="kiosk-section-unlocked">
        <h2
          className="mb-3 text-xl font-semibold"
          id="kiosk-section-unlocked"
        >
          {t("sectionUnlocked")}
        </h2>
        {liberadasUnits.length > 0 ? (
          <KioskSubtaskPanel
            units={liberadasUnits}
            allSubTasks={allSubTasks}
            readOnly={readOnly}
            blockingUi={blockingUi}
            timerPaused={timerPaused}
            exitBusy={exitBusy}
            flashDocumentId={flashDocumentId}
            onStart={onStart}
            onExit={onExit}
            onStartChain={onStartChain}
            onConfirmChainStop={onConfirmChainStop}
            onAdvanceChain={onAdvanceChain}
            onReleaseMaterialFlag={onReleaseMaterialFlag}
            onRefreshMaterialFlags={onRefreshMaterialFlags}
            onChainRunNotReady={onChainRunNotReady}
            openRuns={openRuns}
          />
        ) : null}
        <KioskQueueLoadMoreSentinel
          hasMore={liberadas.hasMore}
          loading={liberadas.loading}
          disabled={blockingUi}
          onLoadMore={onLoadMoreLiberadas}
        />
      </section>

      <KioskQueueSectionAccordion
        id="kiosk-section-locked"
        title={t("sectionLocked")}
        expanded={bloqueadas.expanded}
        onToggle={onToggleBloqueadas}
      >
        {bloqueadas.loading && bloqueadas.units.length === 0 ? (
          <KioskQueueSkeletonList />
        ) : (
          <>
            {bloqueadas.units.length > 0 ? (
              <KioskSubtaskPanel
                units={bloqueadas.units}
                allSubTasks={allSubTasks}
                readOnly={readOnly}
                blockingUi={blockingUi}
                timerPaused={timerPaused}
                exitBusy={exitBusy}
                flashDocumentId={flashDocumentId}
                onStart={onStart}
                onExit={onExit}
                onStartChain={onStartChain}
                onConfirmChainStop={onConfirmChainStop}
                onAdvanceChain={onAdvanceChain}
                onReleaseMaterialFlag={onReleaseMaterialFlag}
                onRefreshMaterialFlags={onRefreshMaterialFlags}
                onChainRunNotReady={onChainRunNotReady}
                openRuns={openRuns}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
            )}
            <KioskQueueLoadMoreSentinel
              hasMore={bloqueadas.hasMore}
              loading={bloqueadas.loading && bloqueadas.units.length > 0}
              disabled={blockingUi}
              onLoadMore={onLoadMoreBloqueadas}
            />
          </>
        )}
      </KioskQueueSectionAccordion>

      <KioskQueueSectionAccordion
        id="kiosk-section-finished"
        title={t("sectionFinishedToday")}
        expanded={finalizadas.expanded}
        onToggle={onToggleFinalizadas}
      >
        {finalizadas.loading && finalizadas.units.length === 0 ? (
          <KioskQueueSkeletonList />
        ) : (
          <>
            {finalizadas.units.length > 0 ? (
              <KioskSubtaskPanel
                units={finalizadas.units}
                allSubTasks={allSubTasks}
                readOnly={readOnly}
                blockingUi={blockingUi}
                compactFinishedCards
                flashDocumentId={flashDocumentId}
                onStart={onStart}
                onExit={onExit}
                onStartChain={onStartChain}
                onConfirmChainStop={onConfirmChainStop}
                onAdvanceChain={onAdvanceChain}
                onReleaseMaterialFlag={onReleaseMaterialFlag}
                onRefreshMaterialFlags={onRefreshMaterialFlags}
                onChainRunNotReady={onChainRunNotReady}
                openRuns={openRuns}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
            )}
            <KioskQueueLoadMoreSentinel
              hasMore={finalizadas.hasMore}
              loading={finalizadas.loading && finalizadas.units.length > 0}
              disabled={blockingUi}
              onLoadMore={onLoadMoreFinalizadas}
            />
          </>
        )}
      </KioskQueueSectionAccordion>
    </div>
  );
}
