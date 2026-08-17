"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { TeamRow } from "./types";

type TeamListContextValue = {
  openEdit: (team: TeamRow) => void;
};

const TeamListContext = createContext<TeamListContextValue | null>(null);

export function TeamListProvider({
  children,
  openEdit,
}: {
  children: ReactNode;
  openEdit: (team: TeamRow) => void;
}) {
  return (
    <TeamListContext.Provider value={{ openEdit }}>
      {children}
    </TeamListContext.Provider>
  );
}

export function useTeamList(): TeamListContextValue {
  const value = useContext(TeamListContext);
  if (!value) {
    throw new Error("useTeamList must be used within TeamListProvider");
  }
  return value;
}
