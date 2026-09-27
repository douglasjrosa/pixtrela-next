"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ListPageActionsContextValue = {
  slotId: string;
  node: HTMLDivElement | null;
  assignNode: (node: HTMLDivElement | null) => void;
};

const ListPageActionsContext =
  createContext<ListPageActionsContextValue | null>(null);

export function ListPageActionsProvider({ children }: { children: ReactNode }) {
  const slotId = useId();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const assignNode = useCallback((next: HTMLDivElement | null) => {
    setNode(next);
  }, []);
  const value = useMemo(
    () => ({ slotId, node, assignNode }),
    [slotId, node, assignNode],
  );

  return (
    <ListPageActionsContext.Provider value={value}>
      {children}
    </ListPageActionsContext.Provider>
  );
}

export function ListPageActionsSlot() {
  const context = useContext(ListPageActionsContext);
  const slotId = context?.slotId;
  const assignNode = context?.assignNode;

  useEffect(() => {
    if (!slotId) return;
    const node = document.getElementById(slotId);
    if (!(node instanceof HTMLDivElement)) return;
    assignNode?.(node);
    return () => assignNode?.(null);
  }, [slotId, assignNode]);

  if (!context) return null;
  return (
    <div
      id={context.slotId}
      data-slot="list-page-actions"
      className="flex items-center gap-2 empty:hidden"
    />
  );
}

export function ListPageActionsPortal({ children }: { children: ReactNode }) {
  const context = useContext(ListPageActionsContext);
  if (!context) return children;
  if (!context.node) return null;
  return createPortal(children, context.node);
}
