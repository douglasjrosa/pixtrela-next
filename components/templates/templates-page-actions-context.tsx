"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { AddNewButton } from "@/components/ui/add-new-button";

import { TemplatesPageHeader } from "./templates-page-header";

export type TemplatesPageActionTab = "subtasks" | "actions";

interface TemplatesPageActionsContextValue {
  registerOpenCreate: (
    tab: TemplatesPageActionTab,
    handler: () => void,
  ) => () => void;
  openCreate: (tab: TemplatesPageActionTab) => void;
}

const TemplatesPageActionsContext =
  createContext<TemplatesPageActionsContextValue | null>(null);

function useTemplatesPageActions(): TemplatesPageActionsContextValue {
  const context = useContext(TemplatesPageActionsContext);
  if (!context) {
    throw new Error(
      "useTemplatesPageActions must be used within TemplatesPageActionsProvider",
    );
  }
  return context;
}

export function useRegisterTemplatesPageCreateAction(
  tab: TemplatesPageActionTab,
  openCreate: () => void,
): void {
  const { registerOpenCreate } = useTemplatesPageActions();

  useEffect(() => {
    return registerOpenCreate(tab, openCreate);
  }, [openCreate, registerOpenCreate, tab]);
}

export function TemplatesPageActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const handlersRef = useRef<Partial<Record<TemplatesPageActionTab, () => void>>>(
    {},
  );

  const registerOpenCreate = useCallback(
    (tab: TemplatesPageActionTab, handler: () => void) => {
      handlersRef.current[tab] = handler;
      return () => {
        if (handlersRef.current[tab] === handler) {
          delete handlersRef.current[tab];
        }
      };
    },
    [],
  );

  const openCreate = useCallback((tab: TemplatesPageActionTab) => {
    handlersRef.current[tab]?.();
  }, []);

  return (
    <TemplatesPageActionsContext.Provider
      value={{ registerOpenCreate, openCreate }}
    >
      {children}
    </TemplatesPageActionsContext.Provider>
  );
}

function resolveTemplatesChromeTab(
  pathname: string,
): "tasks" | TemplatesPageActionTab | null {
  if (pathname.startsWith("/templates/tasks")) return "tasks";
  if (pathname.startsWith("/templates/subtasks")) return "subtasks";
  if (pathname.startsWith("/templates/actions")) return "actions";
  return null;
}

export function TemplatesChromeActions() {
  const pathname = usePathname();
  const tab = resolveTemplatesChromeTab(pathname);
  const tPresets = useTranslations("subTaskPresets");
  const tActions = useTranslations("factoryActions");
  const { openCreate } = useTemplatesPageActions();

  if (tab === "tasks") {
    return <TemplatesPageHeader />;
  }

  if (tab === "subtasks") {
    return (
      <AddNewButton
        label={tPresets("new")}
        onClick={() => openCreate("subtasks")}
      />
    );
  }

  if (tab === "actions") {
    return (
      <AddNewButton
        label={tActions("new")}
        onClick={() => openCreate("actions")}
      />
    );
  }

  return null;
}
