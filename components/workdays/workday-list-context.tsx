"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { WorkdayRow } from "./types";

type WorkdayListContextValue = {
  openEdit: (workday: WorkdayRow) => void;
};

const WorkdayListContext = createContext<WorkdayListContextValue | null>(null);

export function WorkdayListProvider({
  children,
  openEdit,
}: {
  children: ReactNode;
  openEdit: (workday: WorkdayRow) => void;
}) {
  return (
    <WorkdayListContext.Provider value={{ openEdit }}>
      {children}
    </WorkdayListContext.Provider>
  );
}

export function useWorkdayList(): WorkdayListContextValue {
  const value = useContext(WorkdayListContext);
  if (!value) {
    throw new Error("useWorkdayList must be used within WorkdayListProvider");
  }
  return value;
}
