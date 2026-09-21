"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ActivityRow } from "./types";

type ActivityEditHandler = (activity: ActivityRow) => void;

const ActivityEditContext = createContext<ActivityEditHandler | null>(null);

export function ActivityEditProvider({
  onEdit,
  children,
}: {
  onEdit: ActivityEditHandler;
  children: ReactNode;
}) {
  return (
    <ActivityEditContext.Provider value={onEdit}>
      {children}
    </ActivityEditContext.Provider>
  );
}

export function useActivityEdit(): ActivityEditHandler | null {
  return useContext(ActivityEditContext);
}
