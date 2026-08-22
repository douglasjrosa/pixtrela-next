"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ListSelectionContextValue = {
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelect: (documentId: string) => void;
  onToggleSelectAll: () => void;
};

const ListSelectionContext = createContext<ListSelectionContextValue | null>(
  null,
);

export function ListSelectionProvider({
  value,
  children,
}: {
  value: ListSelectionContextValue | null;
  children: ReactNode;
}) {
  return (
    <ListSelectionContext.Provider value={value}>
      {children}
    </ListSelectionContext.Provider>
  );
}

export function useListSelection(): ListSelectionContextValue | null {
  return useContext(ListSelectionContext);
}
