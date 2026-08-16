"use client";

import { createContext, useContext, type ReactNode } from "react";

export type TeamListSelectionContextValue = {
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelect: (documentId: string) => void;
  onToggleSelectAll: () => void;
};

const TeamListSelectionContext =
  createContext<TeamListSelectionContextValue | null>(null);

export function TeamListSelectionProvider({
  value,
  children,
}: {
  value: TeamListSelectionContextValue | null;
  children: ReactNode;
}) {
  return (
    <TeamListSelectionContext.Provider value={value}>
      {children}
    </TeamListSelectionContext.Provider>
  );
}

export function useTeamListSelection(): TeamListSelectionContextValue | null {
  return useContext(TeamListSelectionContext);
}
