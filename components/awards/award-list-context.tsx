"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AwardRow } from "./types";

type AwardListContextValue = {
  openEdit?: (award: AwardRow) => void;
};

const AwardListContext = createContext<AwardListContextValue | null>(null);

export function AwardListProvider({
  children,
  openEdit,
}: {
  children: ReactNode;
  openEdit?: (award: AwardRow) => void;
}) {
  return (
    <AwardListContext.Provider value={{ openEdit }}>
      {children}
    </AwardListContext.Provider>
  );
}

export function useAwardList(): AwardListContextValue {
  const value = useContext(AwardListContext);
  if (!value) {
    throw new Error("useAwardList must be used within AwardListProvider");
  }
  return value;
}
