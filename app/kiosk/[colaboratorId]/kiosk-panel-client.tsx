"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useTranslations } from "next-intl";

import {
  saveKioskColaboratorFacePhoto,
  saveKioskColaboratorPassword,
  saveKioskOwnColaboratorPassword,
  type KioskColaboratorPasswordResult,
} from "@/app/kiosk/staff/[userId]/users/actions";
import { KioskColaboratorFacePhotoForm } from "@/components/kiosk/kiosk-colaborator-face-photo-form";
import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import { KioskColaboratorPasswordForm } from "@/components/kiosk/kiosk-colaborator-password-form";
import { BackLink } from "@/components/navigation/back-link";
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
  applyOptimisticKioskExitToSubTasks,
  applyOptimisticKioskStartToOpenRuns,
  applyOptimisticKioskStartToSubTasks,
  applyOptimisticStateToLiberadasSection,
  isOptimisticChainStopSettled,
  isOptimisticKioskExitSettled,
  isOptimisticKioskStartSettled,
  resolvePersistedChainRunId,
  type OptimisticKioskChainStop,
  type OptimisticKioskExit,
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
import {
  showKioskErrorToast,
  showKioskSuccessToast,
} from "@/lib/kiosk/kiosk-toast";
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
  if (code === "chainStopInconsistent") return t("chainStopInconsistent");
  return t("exitFailed");
}

type PasswordSaveError = Extract<
  KioskColaboratorPasswordResult,
  { ok: false }
>["error"];

function editPasswordErrorMessage(
  error: PasswordSaveError,
  t: (key: string) => string,
): string {
  if (error === "passwordMismatch") return t("staffPasswordMismatch");
  if (error === "invalid") return t("staffPasswordInvalid");
  return t("staffPasswordForbidden");
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
  facePhotoUrl?: string | null;
  initialLiberadas: KioskQueueSectionPage;
  maxSimultaneousSubtaskIntervalSeconds?: number;
  readOnly?: boolean;
  staffUserId?: string;
  allowFaceEdit?: boolean;
  backHref?: string;
  /** Matches parent content surface top corners when backHref is set. */
  toolbarTopRadiusClass?: string;
}

export function KioskPanelClient({
  colaboratorId,
  colaboratorName,
  avatarUrl = null,
  facePhotoUrl = null,
  initialLiberadas,
  readOnly = false,
  staffUserId,
  allowFaceEdit = false,
  backHref,
  toolbarTopRadiusClass = "rounded-t-2xl sm:rounded-t-2xl",
}: KioskPanelClientProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [currentFacePhotoUrl, setCurrentFacePhotoUrl] = useState(facePhotoUrl);
  const [queueBusy, setQueueBusy] = useState<"start" | "exit" | null>(null);
  const [optimisticStart, setOptimisticStart] =
    useState<OptimisticKioskStart | null>(null);
  const [optimisticChainStop, setOptimisticChainStop] =
    useState<OptimisticKioskChainStop | null>(null);
  const [optimisticExit, setOptimisticExit] =
    useState<OptimisticKioskExit | null>(null);
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

  const displaySubTasks = useMemo(
    () =>
      applyOptimisticKioskExitToSubTasks(
        applyOptimisticChainStopToSubTasks(
          applyOptimisticKioskStartToSubTasks(subTasks, optimisticStart),
          optimisticChainStop,
        ),
        optimisticExit,
      ),
    [optimisticChainStop, optimisticExit, optimisticStart, subTasks],
  );
  const displayCatalog = useMemo(
    () =>
      applyOptimisticKioskExitToSubTasks(
        applyOptimisticChainStopToSubTasks(
          applyOptimisticKioskStartToSubTasks(catalog, optimisticStart),
          optimisticChainStop,
        ),
        optimisticExit,
      ),
    [catalog, optimisticChainStop, optimisticExit, optimisticStart],
  );
  const displayOpenRuns = useMemo(
    () =>
      applyOptimisticChainStopToOpenRuns(
        applyOptimisticKioskStartToOpenRuns(
          openRuns,
          optimisticStart,
          colaboratorId,
        ),
        optimisticChainStop,
      ),
    [colaboratorId, openRuns, optimisticChainStop, optimisticStart],
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

  if (optimisticExit && isOptimisticKioskExitSettled(subTasks, optimisticExit)) {
    setOptimisticExit(null);
  }

  const displayLiberadas = useMemo(
    () => ({
      ...liberadas,
      ...applyOptimisticStateToLiberadasSection(
        liberadas,
        displaySubTasks,
        displayOpenRuns,
        colaboratorId,
      ),
    }),
    [colaboratorId, displayOpenRuns, displaySubTasks, liberadas],
  );

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
      staffUserId,
    });
    applyPageToLiberadas(page);
  }, [applyPageToLiberadas, colaboratorId, staffUserId]);

  const refreshExpandedAccordions = useCallback(async (): Promise<void> => {
    if (bloqueadas.expanded) {
      const page = await fetchKioskQueueSectionPage({
        colaboratorId,
        section: "bloqueadas",
        staffUserId,
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
        staffUserId,
      });
      setFinalizadas(sectionFromPage(page, true));
      setSubTasks((current) => mergeSubTasks(current, page.subTasks));
      setCatalog(page.catalog);
      setOpenRuns(page.openRuns);
    }
  }, [bloqueadas.expanded, colaboratorId, finalizadas.expanded, staffUserId]);

  const refreshAfterMutation = useCallback(async (): Promise<void> => {
    await refreshLiberadas();
    void refreshExpandedAccordions();
  }, [refreshExpandedAccordions, refreshLiberadas]);

  const runBackgroundAction = useCallback(
    (action: () => Promise<void>, onError?: (error: unknown) => void): void => {
      void (async () => {
        try {
          await action();
          setQueueBusy(null);
          await refreshLiberadas();
          void refreshExpandedAccordions();
        } catch (error) {
          rethrowIfNavigationError(error);
          setOptimisticStart(null);
          setQueueBusy(null);
          exitFingerprintRef.current = null;
          onError?.(error);
        }
      })();
    },
    [refreshExpandedAccordions, refreshLiberadas],
  );

  const runExitAction = useCallback(
    (action: () => Promise<void>, onError?: (error: unknown) => void): void => {
      void (async () => {
        try {
          await action();
          await refreshLiberadas();
          void refreshExpandedAccordions();
        } catch (error) {
          rethrowIfNavigationError(error);
          onError?.(error);
        } finally {
          exitFingerprintRef.current = null;
          setQueueBusy(null);
        }
      })();
    },
    [refreshExpandedAccordions, refreshLiberadas],
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
          staffUserId,
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
        showKioskErrorToast(t("queueLoadFailed"));
      } finally {
        loadingMoreRef.current = false;
      }
    },
    [colaboratorId, staffUserId, t],
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
          staffUserId,
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
        showKioskErrorToast(t("queueLoadFailed"));
      }
    })();
  }, [bloqueadas.expanded, bloqueadas.loadedOnce, colaboratorId, staffUserId, t]);

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
          staffUserId,
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
        showKioskErrorToast(t("queueLoadFailed"));
      }
    })();
  }, [colaboratorId, finalizadas.expanded, finalizadas.loadedOnce, staffUserId, t]);

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
        await joinLiveChain(colaboratorId, documentId, staffUserId);
      } else {
        await startSubTask(colaboratorId, documentId, staffUserId);
      }
    }, () => {
      showKioskErrorToast(t("startFailed"));
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
      await startChain(colaboratorId, headId, staffUserId);
    }, () => {
      showKioskErrorToast(t("startFailed"));
    });
  }

  const handleAdvanceChain = useCallback(
    (chainRunId: string): void => {
      if (queueBusy) return;
      void (async () => {
        try {
          await advanceChainRun(colaboratorId, chainRunId, staffUserId);
          await refreshAfterMutation();
        } catch (error) {
          rethrowIfNavigationError(error);
          showKioskErrorToast(t("exitFailed"));
        }
      })();
    },
    [colaboratorId, queueBusy, refreshAfterMutation, staffUserId, t],
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
      showKioskErrorToast(t("chainRunNotReady"));
      return;
    }
    if (queueBusy) {
      showKioskErrorToast(t("actionLoading"));
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
      await confirmChainStop(colaboratorId, persistedId, answers, staffUserId);
      showKioskSuccessToast(t("exitRecorded"));
    }, (error) => {
      setOptimisticChainStop(null);
      showKioskErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleChainRunNotReady(): void {
    showKioskErrorToast(t("chainRunNotReady"));
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
    setOptimisticExit({ documentId, exit: input });
    setQueueBusy("exit");
    runExitAction(async () => {
      const result = await exitSubTask(
        colaboratorId,
        documentId,
        subTask.sharingType,
        input,
        subTask.targetQty,
        subTask.completedQty,
        staffUserId,
      );
      const names = formatRemainingWorkerNames(result.remainingWorkerNames);
      if (names) {
        showKioskSuccessToast(t("exitOthersStillActive", { name: names }));
        return;
      }
      showKioskSuccessToast(t("exitRecorded"));
    }, (error) => {
      setOptimisticExit(null);
      showKioskErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleReleaseMaterialFlag(flagId: string): void {
    if (queueBusy) return;
    setQueueBusy("exit");
    runBackgroundAction(async () => {
      await releaseMaterialFlag(flagId, colaboratorId, staffUserId);
      showKioskSuccessToast(t("flagsReleased"));
      setQueueBusy(null);
    }, (error) => {
      showKioskErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  async function handleRefreshMaterialFlags(subTaskId: string): Promise<{
    flags: Array<{ id: string; code: string }>;
    categoryId: string | null;
    requiresMaterialFlagsOnFinish: boolean;
  }> {
    return refreshMaterialFlags(subTaskId, colaboratorId, staffUserId);
  }

  async function handleSaveEditPassword(input: {
    password: string;
    confirmPassword: string;
  }): Promise<boolean> {
    setEditPending(true);
    try {
      const result = staffUserId
        ? await saveKioskColaboratorPassword(staffUserId, colaboratorId, input)
        : await saveKioskOwnColaboratorPassword(colaboratorId, input);
      if (!result.ok) {
        showKioskErrorToast(editPasswordErrorMessage(result.error, t));
        return false;
      }
      showKioskSuccessToast(t("staffPasswordSaved"));
      setEditOpen(false);
      return true;
    } finally {
      setEditPending(false);
    }
  }

  async function handleSaveEditFacePhoto(
    file: File,
    options?: { faceVector: number[] },
  ): Promise<boolean> {
    if (!staffUserId) return false;
    setEditPending(true);
    try {
      const result = await saveKioskColaboratorFacePhoto(
        staffUserId,
        colaboratorId,
        file,
        options?.faceVector,
      );
      if (!result.ok) {
        showKioskErrorToast(t("staffFacePhotoForbidden"));
        return false;
      }
      setCurrentFacePhotoUrl(result.facePhotoUrl);
      showKioskSuccessToast(t("staffFacePhotoSaved"));
      return true;
    } finally {
      setEditPending(false);
    }
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

  const showEdit = !readOnly;

  const headerProps = {
    name: colaboratorName,
    avatarUrl,
    showEdit,
    editOpen,
    onEditClick: () => setEditOpen((open) => !open),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {colaboratorName ? (
        backHref ? (
          <div
            className={
              "sticky top-0 z-30 shrink-0 border-b bg-background/95 " +
              `backdrop-blur-sm px-4 py-3 ${toolbarTopRadiusClass}`
            }
          >
            <div className="flex items-center justify-between gap-3">
              <BackLink href={backHref} className="shrink-0">
                {tCommon("back")}
              </BackLink>
              <KioskColaboratorHeader
                {...headerProps}
                className="max-w-[min(100%,14rem)] shrink-0"
              />
            </div>
          </div>
        ) : (
          <div
            className={
              "sticky top-0 z-30 shrink-0 border-b bg-background/95 " +
              "backdrop-blur-sm px-4 py-3"
            }
          >
            <KioskColaboratorHeader {...headerProps} className="w-full" />
          </div>
        )
      ) : null}
      {editOpen && showEdit ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {allowFaceEdit ? (
            <KioskColaboratorFacePhotoForm
              facePhotoUrl={currentFacePhotoUrl}
              disabled={editPending}
              onSave={handleSaveEditFacePhoto}
            />
          ) : null}
          <KioskColaboratorPasswordForm
            colaboratorName={colaboratorName}
            disabled={editPending}
            onCancel={() => setEditOpen(false)}
            onSave={handleSaveEditPassword}
          />
        </div>
      ) : (
        <div className="relative min-h-0 flex-1">
          <KioskDailyQueue
          colaboratorId={colaboratorId}
          liberadas={displayLiberadas}
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
      )}
    </div>
  );
}
