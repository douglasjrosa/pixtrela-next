"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

export type KioskQueueProfileSeed = {
  name: string;
  avatarUrl: string | null;
};

export type KioskQueueBootstrapApi = {
  liberadasLoaded: boolean;
  editOpen: boolean;
  onEditClick: () => void;
  applyProducingSnapshot: (page: KioskQueueSectionPage) => void;
  applyLiberadasPage: (page: KioskQueueSectionPage) => void;
  applyProfile: (profile: KioskQueueProfileSeed) => void;
};

const KioskQueueBootstrapContext = createContext<KioskQueueBootstrapApi | null>(
  null,
);

export function KioskQueueBootstrapProvider({
  value,
  children,
}: {
  value: KioskQueueBootstrapApi;
  children: ReactNode;
}) {
  return (
    <KioskQueueBootstrapContext.Provider value={value}>
      {children}
    </KioskQueueBootstrapContext.Provider>
  );
}

export function useKioskQueueBootstrap(): KioskQueueBootstrapApi {
  const value = useContext(KioskQueueBootstrapContext);
  if (!value) {
    throw new Error("KioskQueueBootstrapProvider is required");
  }
  return value;
}
