"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AwardListSelectionContextValue = {
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelect: (documentId: string) => void;
  onToggleSelectAll: () => void;
};

const AwardListSelectionContext =
  createContext<AwardListSelectionContextValue | null>(null);

export function AwardListSelectionProvider({
  value,
  children,
}: {
  value: AwardListSelectionContextValue | null;
  children: ReactNode;
}) {
  return (
    <AwardListSelectionContext.Provider value={value}>
      {children}
    </AwardListSelectionContext.Provider>
  );
}

export function useAwardListSelection(): AwardListSelectionContextValue | null {
  return useContext(AwardListSelectionContext);
}
