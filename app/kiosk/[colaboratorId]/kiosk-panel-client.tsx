"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";

import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import {
  KioskDailyQueue,
  type KioskSectionState,
} from "@/components/kiosk/kiosk-daily-queue";
import type {
  KioskQueueUnit,
  OpenChainRun,
} from "@/lib/business/kiosk-queue-units";
import {
  applyOptimisticChainStopToOpenRuns,
  applyOptimisticChainStopToSubTasks,
  applyOptimisticKioskStartToOpenRuns,
  applyOptimisticKioskStartToSubTasks,
  isOptimisticChainStopSettled,
  isOptimisticKioskStartSettled,
  resolvePersistedChainRunId,
  type OptimisticKioskChainStop,
  type OptimisticKioskStart,
} from "@/lib/business/kiosk-optimistic-start";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import {
  formatRemainingWorkerNames,
  hasActiveSubTask,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import { buildKioskQueueFingerprint } from "@/lib/kiosk/queue-fingerprint";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { markKioskColaboratorReady } from "@/lib/welcome/kiosk-welcome-ready";

import {
  advanceChainRun,
  confirmChainStop,
  exitSubTask,
  fetchKioskQueueSectionPage,
  joinLiveChain,
  refreshMaterialFlags,
  releaseMaterialFlag,
  startChain,
  startSubTask,
} from "./actions";

const START_FLASH_MS = 300;

function kioskActionErrorMessage(
  t: (key: string) => string,
  error: unknown,
): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "flagsRequired") return t("flagsRequired");
  if (code === "subTaskHasNoCategory") return t("subTaskHasNoCategory");
  if (code === "flagOccupied") return t("flagOccupied");
  return t("exitFailed");
}

function sectionFromPage(
  page: KioskQueueSectionPage,
  expanded: boolean,
): KioskSectionState {
  return {
    producingUnits: page.producingUnits,
    units: page.units,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    expanded,
    loading: false,
    loadedOnce: true,
  };
}

function emptySection(expanded = false): KioskSectionState {
  return {
    producingUnits: [],
    units: [],
    nextCursor: null,
    hasMore: false,
    expanded,
    loading: false,
    loadedOnce: false,
  };
}

function mergeSubTasks(
  current: KioskSubTask[],
  incoming: KioskSubTask[],
): KioskSubTask[] {
  const byId = new Map(current.map((item) => [item.documentId, item]));
  for (const item of incoming) {
    byId.set(item.documentId, item);
  }
  return [...byId.values()];
}

function flattenUnits(units: readonly KioskQueueUnit[]): KioskSubTask[] {
  const byId = new Map<string, KioskSubTask>();
  for (const unit of units) {
    if (unit.type === "isolated") {
      byId.set(unit.subTask.documentId, unit.subTask);
      continue;
    }
    for (const member of unit.members) {
      byId.set(member.documentId, member);
    }
  }
  return [...byId.values()];
}

export interface KioskPanelClientProps {
  colaboratorId: string;
  colaboratorName: string;
  avatarUrl?: string | null;
  initialLiberadas: KioskQueueSectionPage;
  maxSimultaneousSubtaskIntervalSeconds?: number;
  readOnly?: boolean;
}

export function KioskPanelClient({
  colaboratorId,
  colaboratorName,
  avatarUrl = null,
  initialLiberadas,
  readOnly = false,
}: KioskPanelClientProps) {
  const t = useTranslations("kiosk");
  const [queueBusy, setQueueBusy] = useState<"start" | "exit" | null>(null);
  const [optimisticStart, setOptimisticStart] =
    useState<OptimisticKioskStart | null>(null);
  const [optimisticChainStop, setOptimisticChainStop] =
    useState<OptimisticKioskChainStop | null>(null);
  const [flashDocumentId, setFlashDocumentId] = useState<string | null>(null);
  const exitFingerprintRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  const [liberadas, setLiberadas] = useState<KioskSectionState>(() =>
    sectionFromPage(initialLiberadas, true),
  );
  const [bloqueadas, setBloqueadas] = useState<KioskSectionState>(() =>
    emptySection(false),
  );
  const [finalizadas, setFinalizadas] = useState<KioskSectionState>(() =>
    emptySection(false),
  );
  const [openRuns, setOpenRuns] = useState<OpenChainRun[]>(
    () => initialLiberadas.openRuns,
  );
  const [subTasks, setSubTasks] = useState<KioskSubTask[]>(
    () => initialLiberadas.subTasks,
  );
  const [catalog, setCatalog] = useState<KioskSubTask[]>(
    () => initialLiberadas.catalog,
  );

  const displaySubTasks = applyOptimisticChainStopToSubTasks(
    applyOptimisticKioskStartToSubTasks(subTasks, optimisticStart),
    optimisticChainStop,
  );
  const displayCatalog = applyOptimisticChainStopToSubTasks(
    applyOptimisticKioskStartToSubTasks(catalog, optimisticStart),
    optimisticChainStop,
  );
  const displayOpenRuns = applyOptimisticChainStopToOpenRuns(
    applyOptimisticKioskStartToOpenRuns(
      openRuns,
      optimisticStart,
      colaboratorId,
    ),
    optimisticChainStop,
  );

  if (
    optimisticStart &&
    isOptimisticKioskStartSettled(subTasks, optimisticStart)
  ) {
    setOptimisticStart(null);
    setQueueBusy((current) => (current === "start" ? null : current));
  }

  if (
    optimisticChainStop &&
    isOptimisticChainStopSettled(subTasks, openRuns, optimisticChainStop)
  ) {
    setOptimisticChainStop(null);
  }

  useEffect(() => {
    markKioskColaboratorReady();
  }, []);

  useEffect(() => {
    if (queueBusy !== "exit" || exitFingerprintRef.current === null) return;
    const nextFingerprint = buildKioskQueueFingerprint(subTasks, openRuns);
    if (nextFingerprint !== exitFingerprintRef.current) {
      exitFingerprintRef.current = null;
      setQueueBusy(null);
    }
  }, [openRuns, queueBusy, subTasks]);

  const applyPageToLiberadas = useCallback((page: KioskQueueSectionPage) => {
    setLiberadas(sectionFromPage(page, true));
    setOpenRuns(page.openRuns);
    setSubTasks(page.subTasks);
    setCatalog(page.catalog);
  }, []);

  const refreshLiberadas = useCallback(async (): Promise<void> => {
    const page = await fetchKioskQueueSectionPage({
      colaboratorId,
      section: "liberadas",
    });
    applyPageToLiberadas(page);
  }, [applyPageToLiberadas, colaboratorId]);

  const refreshExpandedAccordions = useCallback(async (): Promise<void> => {
    if (bloqueadas.expanded) {
      const page = await fetchKioskQueueSectionPage({
        colaboratorId,
        section: "bloqueadas",
      });
      setBloqueadas(sectionFromPage(page, true));
      setSubTasks((current) => mergeSubTasks(current, page.subTasks));
      setCatalog(page.catalog);
      setOpenRuns(page.openRuns);
    }
    if (finalizadas.expanded) {
      const page = await fetchKioskQueueSectionPage({
        colaboratorId,
        section: "finalizadas_hoje",
      });
      setFinalizadas(sectionFromPage(page, true));
      setSubTasks((current) => mergeSubTasks(current, page.subTasks));
      setCatalog(page.catalog);
      setOpenRuns(page.openRuns);
    }
  }, [bloqueadas.expanded, colaboratorId, finalizadas.expanded]);

  const refreshAfterMutation = useCallback(async (): Promise<void> => {
    await refreshLiberadas();
    await refreshExpandedAccordions();
  }, [refreshExpandedAccordions, refreshLiberadas]);

  const runBackgroundAction = useCallback(
    (action: () => Promise<void>, onError?: (error: unknown) => void): void => {
      void (async () => {
        try {
          await action();
          await refreshAfterMutation();
        } catch (error) {
          rethrowIfNavigationError(error);
          setOptimisticStart(null);
          setQueueBusy(null);
          exitFingerprintRef.current = null;
          onError?.(error);
        }
      })();
    },
    [refreshAfterMutation],
  );

  const runExitAction = useCallback(
    (action: () => Promise<void>, onError?: (error: unknown) => void): void => {
      void (async () => {
        try {
          await action();
          await refreshAfterMutation();
        } catch (error) {
          rethrowIfNavigationError(error);
          onError?.(error);
        } finally {
          exitFingerprintRef.current = null;
          setQueueBusy(null);
        }
      })();
    },
    [refreshAfterMutation],
  );

  const loadMoreSection = useCallback(
    async (
      section: "liberadas" | "bloqueadas" | "finalizadas_hoje",
      state: KioskSectionState,
      setState: Dispatch<SetStateAction<KioskSectionState>>,
    ): Promise<void> => {
      if (!state.hasMore || state.loading || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setState((current) => ({ ...current, loading: true }));
      try {
        const page = await fetchKioskQueueSectionPage({
          colaboratorId,
          section,
          cursor: state.nextCursor,
        });
        setState((current) => ({
          ...current,
          units: [...current.units, ...page.units],
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          loading: false,
          loadedOnce: true,
        }));
        setSubTasks((current) => mergeSubTasks(current, page.subTasks));
        setCatalog(page.catalog);
        setOpenRuns(page.openRuns);
      } catch (error) {
        rethrowIfNavigationError(error);
        setState((current) => ({ ...current, loading: false }));
        showErrorToast(t("exitFailed"));
      } finally {
        loadingMoreRef.current = false;
      }
    },
    [colaboratorId, t],
  );

  const handleLoadMoreLiberadas = useCallback(() => {
    void loadMoreSection("liberadas", liberadas, setLiberadas);
  }, [liberadas, loadMoreSection]);

  const handleLoadMoreBloqueadas = useCallback(() => {
    void loadMoreSection("bloqueadas", bloqueadas, setBloqueadas);
  }, [bloqueadas, loadMoreSection]);

  const handleLoadMoreFinalizadas = useCallback(() => {
    void loadMoreSection("finalizadas_hoje", finalizadas, setFinalizadas);
  }, [finalizadas, loadMoreSection]);

  const handleToggleBloqueadas = useCallback(() => {
    if (bloqueadas.expanded) {
      setBloqueadas((current) => ({ ...current, expanded: false }));
      return;
    }
    if (bloqueadas.loadedOnce) {
      setBloqueadas((current) => ({ ...current, expanded: true }));
      return;
    }
    setBloqueadas((current) => ({
      ...current,
      expanded: true,
      loading: true,
    }));
    void (async () => {
      try {
        const page = await fetchKioskQueueSectionPage({
          colaboratorId,
          section: "bloqueadas",
        });
        setBloqueadas(sectionFromPage(page, true));
        setSubTasks((current) => mergeSubTasks(current, page.subTasks));
        setCatalog(page.catalog);
        setOpenRuns(page.openRuns);
      } catch (error) {
        rethrowIfNavigationError(error);
        setBloqueadas((current) => ({
          ...current,
          expanded: false,
          loading: false,
        }));
        showErrorToast(t("exitFailed"));
      }
    })();
  }, [bloqueadas.expanded, bloqueadas.loadedOnce, colaboratorId, t]);

  const handleToggleFinalizadas = useCallback(() => {
    if (finalizadas.expanded) {
      setFinalizadas((current) => ({ ...current, expanded: false }));
      return;
    }
    if (finalizadas.loadedOnce) {
      setFinalizadas((current) => ({ ...current, expanded: true }));
      return;
    }
    setFinalizadas((current) => ({
      ...current,
      expanded: true,
      loading: true,
    }));
    void (async () => {
      try {
        const page = await fetchKioskQueueSectionPage({
          colaboratorId,
          section: "finalizadas_hoje",
        });
        setFinalizadas(sectionFromPage(page, true));
        setSubTasks((current) => mergeSubTasks(current, page.subTasks));
        setCatalog(page.catalog);
        setOpenRuns(page.openRuns);
      } catch (error) {
        rethrowIfNavigationError(error);
        setFinalizadas((current) => ({
          ...current,
          expanded: false,
          loading: false,
        }));
        showErrorToast(t("exitFailed"));
      }
    })();
  }, [colaboratorId, finalizadas.expanded, finalizadas.loadedOnce, t]);

  function handleStart(documentId: string): void {
    if (queueBusy) return;
    setFlashDocumentId(documentId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);
    const startedAt = new Date().toISOString();
    const mode = hasActiveSubTask(subTasks) ? "join" : "solo";
    setOptimisticStart({ documentId, startedAt, mode });
    setQueueBusy("start");
    runBackgroundAction(async () => {
      if (mode === "join") {
        await joinLiveChain(colaboratorId, documentId);
      } else {
        await startSubTask(colaboratorId, documentId);
      }
      setQueueBusy(null);
    }, () => {
      showErrorToast(t("startFailed"));
    });
  }

  function handleStartChain(headId: string): void {
    if (queueBusy) return;
    setFlashDocumentId(headId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);
    const startedAt = new Date().toISOString();
    setOptimisticStart({
      documentId: headId,
      startedAt,
      mode: "chain",
      chainHeadId: headId,
    });
    setQueueBusy("start");
    runBackgroundAction(async () => {
      await startChain(colaboratorId, headId);
      setQueueBusy(null);
    }, () => {
      showErrorToast(t("startFailed"));
    });
  }

  const handleAdvanceChain = useCallback(
    (chainRunId: string): void => {
      if (queueBusy) return;
      void (async () => {
        try {
          await advanceChainRun(chainRunId);
          await refreshAfterMutation();
        } catch (error) {
          rethrowIfNavigationError(error);
          showErrorToast(t("exitFailed"));
        }
      })();
    },
    [queueBusy, refreshAfterMutation, t],
  );

  function handleConfirmChainStop(
    chainRunId: string,
    answers: ChainStopAnswer[],
  ): void {
    const persistedId = resolvePersistedChainRunId(
      chainRunId,
      displayOpenRuns,
    );
    if (!persistedId) {
      showErrorToast(t("chainRunNotReady"));
      return;
    }
    if (queueBusy) {
      showErrorToast(t("actionLoading"));
      return;
    }
    exitFingerprintRef.current = buildKioskQueueFingerprint(
      subTasks,
      openRuns,
    );
    setQueueBusy("exit");
    const openRun = displayOpenRuns.find(
      (run) => run.chainRunId === persistedId,
    );
    setOptimisticChainStop({
      chainRunId: persistedId,
      chainHeadId: openRun?.chainHeadId ?? answers[0]!.documentId,
      memberIds: answers.map((answer) => answer.documentId),
      answers,
    });
    runExitAction(async () => {
      await confirmChainStop(colaboratorId, persistedId, answers);
      showSuccessToast(t("exitRecorded"));
    }, (error) => {
      setOptimisticChainStop(null);
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleChainRunNotReady(): void {
    showErrorToast(t("chainRunNotReady"));
  }

  function handleExit(documentId: string, input: KioskExitInput): void {
    const subTask = displaySubTasks.find(
      (item) => item.documentId === documentId,
    );
    if (!subTask || queueBusy) return;

    exitFingerprintRef.current = buildKioskQueueFingerprint(
      subTasks,
      openRuns,
    );
    setQueueBusy("exit");
    runExitAction(async () => {
      const result = await exitSubTask(
        colaboratorId,
        documentId,
        subTask.sharingType,
        input,
        subTask.targetQty,
        subTask.completedQty,
      );
      const names = formatRemainingWorkerNames(result.remainingWorkerNames);
      if (names) {
        showSuccessToast(t("exitOthersStillActive", { name: names }));
        return;
      }
      showSuccessToast(t("exitRecorded"));
    }, (error) => {
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleReleaseMaterialFlag(flagId: string): void {
    if (queueBusy) return;
    setQueueBusy("exit");
    runBackgroundAction(async () => {
      await releaseMaterialFlag(flagId);
      showSuccessToast(t("flagsReleased"));
      setQueueBusy(null);
    }, (error) => {
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  async function handleRefreshMaterialFlags(subTaskId: string): Promise<{
    flags: Array<{ id: string; code: string }>;
    categoryId: string | null;
    requiresMaterialFlagsOnFinish: boolean;
  }> {
    return refreshMaterialFlags(subTaskId);
  }

  const allSubTasksForPanel = mergeSubTasks(
    displayCatalog,
    mergeSubTasks(displaySubTasks, [
      ...flattenUnits(liberadas.producingUnits),
      ...flattenUnits(liberadas.units),
      ...flattenUnits(bloqueadas.units),
      ...flattenUnits(finalizadas.units),
    ]),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {colaboratorName ? (
        <KioskColaboratorHeader
          name={colaboratorName}
          avatarUrl={avatarUrl}
          className="sticky top-0 z-30 shrink-0 bg-background/95 backdrop-blur-sm"
        />
      ) : null}
      <div className="relative min-h-0 flex-1">
        <KioskDailyQueue
          colaboratorId={colaboratorId}
          liberadas={liberadas}
          bloqueadas={bloqueadas}
          finalizadas={finalizadas}
          allSubTasks={allSubTasksForPanel}
          openRuns={displayOpenRuns}
          readOnly={readOnly}
          blockingUi={queueBusy !== null}
          timerPaused={queueBusy === "exit"}
          exitBusy={queueBusy === "exit"}
          flashDocumentId={flashDocumentId}
          onLoadMoreLiberadas={handleLoadMoreLiberadas}
          onToggleBloqueadas={handleToggleBloqueadas}
          onLoadMoreBloqueadas={handleLoadMoreBloqueadas}
          onToggleFinalizadas={handleToggleFinalizadas}
          onLoadMoreFinalizadas={handleLoadMoreFinalizadas}
          onStart={readOnly ? undefined : handleStart}
          onExit={readOnly ? undefined : handleExit}
          onStartChain={readOnly ? undefined : handleStartChain}
          onConfirmChainStop={readOnly ? undefined : handleConfirmChainStop}
          onAdvanceChain={readOnly ? undefined : handleAdvanceChain}
          onReleaseMaterialFlag={
            readOnly ? undefined : handleReleaseMaterialFlag
          }
          onRefreshMaterialFlags={
            readOnly ? undefined : handleRefreshMaterialFlags
          }
          onChainRunNotReady={readOnly ? undefined : handleChainRunNotReady}
        />
      </div>
    </div>
  );
}
