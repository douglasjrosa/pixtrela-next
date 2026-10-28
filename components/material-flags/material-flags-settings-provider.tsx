"use client";

import { createContext, useContext, type ReactNode } from "react";

const MaterialFlagsSettingsContext = createContext(true);

export function MaterialFlagsSettingsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <MaterialFlagsSettingsContext.Provider value={enabled}>
      {children}
    </MaterialFlagsSettingsContext.Provider>
  );
}

export function useMaterialFlagsEnabled(): boolean {
  return useContext(MaterialFlagsSettingsContext);
}
