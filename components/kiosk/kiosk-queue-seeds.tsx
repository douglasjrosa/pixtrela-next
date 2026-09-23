"use client";

import { useEffect } from "react";

import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import { KioskSubtaskPanel } from "@/components/kiosk/kiosk-subtask-panel";
import { mergeKioskCatalog } from "@/lib/business/kiosk-queue-catalog-scope";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

import { useKioskQueueBootstrap } from "./kiosk-queue-bootstrap-context";
import { useKioskQueuePanelActions } from "./kiosk-queue-panel-actions-context";

export function KioskQueueProducingSeed({
  page,
}: {
  page: KioskQueueSectionPage;
}) {
  const { applyProducingSnapshot, liberadasLoaded } = useKioskQueueBootstrap();
  const panel = useKioskQueuePanelActions();

  useEffect(() => {
    applyProducingSnapshot(page);
  }, [applyProducingSnapshot, page]);

  if (liberadasLoaded || page.producingUnits.length === 0) return null;

  return (
    <KioskSubtaskPanel
      units={page.producingUnits}
      allSubTasks={mergeKioskCatalog(page.catalog, page.subTasks)}
      {...panel}
    />
  );
}

export function KioskQueueLiberadasSeed({
  page,
}: {
  page: KioskQueueSectionPage;
}) {
  const { applyLiberadasPage, liberadasLoaded } = useKioskQueueBootstrap();
  const panel = useKioskQueuePanelActions();

  useEffect(() => {
    applyLiberadasPage(page);
  }, [applyLiberadasPage, page]);

  if (liberadasLoaded || page.units.length === 0) return null;

  return (
    <KioskSubtaskPanel
      units={page.units}
      allSubTasks={mergeKioskCatalog(page.catalog, page.subTasks)}
      {...panel}
    />
  );
}

export function KioskQueueProfileSeed({
  name,
  avatarUrl,
  showEdit = false,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  showEdit?: boolean;
  className?: string;
}) {
  const { applyProfile, editOpen, onEditClick } = useKioskQueueBootstrap();

  useEffect(() => {
    applyProfile({ name, avatarUrl });
  }, [applyProfile, avatarUrl, name]);

  if (!name) return null;

  return (
    <KioskColaboratorHeader
      name={name}
      avatarUrl={avatarUrl}
      showEdit={showEdit}
      editOpen={editOpen}
      onEditClick={onEditClick}
      className={className}
    />
  );
}
