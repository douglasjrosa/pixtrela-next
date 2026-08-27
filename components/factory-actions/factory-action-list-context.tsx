"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { FactoryAction } from "@/lib/business/factory-action";

type FactoryActionListContextValue = {
  openEdit: (action: FactoryAction) => void;
};

const FactoryActionListContext =
  createContext<FactoryActionListContextValue | null>(null);

export function FactoryActionListProvider({
  children,
  openEdit,
}: {
  children: ReactNode;
  openEdit: (action: FactoryAction) => void;
}) {
  return (
    <FactoryActionListContext.Provider value={{ openEdit }}>
      {children}
    </FactoryActionListContext.Provider>
  );
}

export function useFactoryActionList(): FactoryActionListContextValue {
  const value = useContext(FactoryActionListContext);
  if (!value) {
    throw new Error("useFactoryActionList must be used within provider");
  }
  return value;
}
