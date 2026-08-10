"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SubTaskSessionsPanel } from "@/components/subtasks/subtask-sessions-panel";
import type { ActivitySession, SharingType } from "@/lib/business/task-progress";

export interface SubTaskSessionsLoaderProps {
  subTaskDocumentId: string;
  sharingType: SharingType;
  loadSessions: (subTaskDocumentId: string) => Promise<ActivitySession[]>;
}

export function SubTaskSessionsLoader({
  subTaskDocumentId,
  sharingType,
  loadSessions,
}: SubTaskSessionsLoaderProps) {
  const t = useTranslations("subtasks");
  const [loadState, setLoadState] = useState<{
    subTaskDocumentId: string;
    sessions: ActivitySession[] | null;
  }>({ subTaskDocumentId, sessions: null });

  if (loadState.subTaskDocumentId !== subTaskDocumentId) {
    setLoadState({ subTaskDocumentId, sessions: null });
  }

  useEffect(() => {
    let cancelled = false;
    void loadSessions(subTaskDocumentId).then((loaded) => {
      if (!cancelled) {
        setLoadState({ subTaskDocumentId, sessions: loaded });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subTaskDocumentId, loadSessions]);

  if (loadState.sessions === null) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("sessionsLoading")}
      </p>
    );
  }

  return (
    <SubTaskSessionsPanel
      sessions={loadState.sessions}
      sharingType={sharingType}
    />
  );
}
