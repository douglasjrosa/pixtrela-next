"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { KioskDailyQueueProps } from "@/components/kiosk/kiosk-daily-queue";

export type KioskQueuePanelActions = Pick<
  KioskDailyQueueProps,
  | "readOnly"
  | "blockingUi"
  | "timerPaused"
  | "exitBusy"
  | "flashDocumentId"
  | "onStart"
  | "onExit"
  | "onStartChain"
  | "onConfirmChainStop"
  | "onAdvanceChain"
  | "onReleaseMaterialFlag"
  | "onRefreshMaterialFlags"
>;

const KioskQueuePanelActionsContext =
  createContext<KioskQueuePanelActions | null>(null);

export function KioskQueuePanelActionsProvider({
  value,
  children,
}: {
  value: KioskQueuePanelActions;
  children: ReactNode;
}) {
  return (
    <KioskQueuePanelActionsContext.Provider value={value}>
      {children}
    </KioskQueuePanelActionsContext.Provider>
  );
}

export function useKioskQueuePanelActions(): KioskQueuePanelActions {
  const value = useContext(KioskQueuePanelActionsContext);
  if (!value) {
    throw new Error("KioskQueuePanelActionsProvider is required");
  }
  return value;
}
