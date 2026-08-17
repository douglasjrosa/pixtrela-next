"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SubTaskPreset } from "@/lib/business/subtask-preset";

type SubTaskPresetListContextValue = {
  openEdit: (preset: SubTaskPreset) => void;
};

const SubTaskPresetListContext =
  createContext<SubTaskPresetListContextValue | null>(null);

export function SubTaskPresetListProvider({
  children,
  openEdit,
}: {
  children: ReactNode;
  openEdit: (preset: SubTaskPreset) => void;
}) {
  return (
    <SubTaskPresetListContext.Provider value={{ openEdit }}>
      {children}
    </SubTaskPresetListContext.Provider>
  );
}

export function useSubTaskPresetList(): SubTaskPresetListContextValue {
  const value = useContext(SubTaskPresetListContext);
  if (!value) {
    throw new Error("useSubTaskPresetList must be used within provider");
  }
  return value;
}
