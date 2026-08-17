"use client";

import { createContext, useContext, type ReactNode } from "react";

export type TemplateListSelectionContextValue = {
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelect: (documentId: string) => void;
  onToggleSelectAll: () => void;
};

const TemplateListSelectionContext =
  createContext<TemplateListSelectionContextValue | null>(null);

export function TemplateListSelectionProvider({
  value,
  children,
}: {
  value: TemplateListSelectionContextValue | null;
  children: ReactNode;
}) {
  return (
    <TemplateListSelectionContext.Provider value={value}>
      {children}
    </TemplateListSelectionContext.Provider>
  );
}

export function useTemplateListSelection(): TemplateListSelectionContextValue | null {
  return useContext(TemplateListSelectionContext);
}
