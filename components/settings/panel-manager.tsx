"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PanelArchivedFilterModal } from "@/components/settings/panel-archived-filter-modal";
import {
  PanelFormModal,
  type PanelStepOption,
} from "@/components/settings/panel-form-modal";
import type { TargetOption } from "@/components/workdays/types";
import { AddNewButton } from "@/components/ui/add-new-button";
import { ArchiveReasonModal } from "@/components/ui/archive-reason-modal";
import { CardBadge } from "@/components/ui/card";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListNameSearch } from "@/components/ui/list-name-search";
import {
  ListPageActionsPortal,
  ListPageActionsProvider,
} from "@/components/ui/list-page-actions-slot";
import { ListPageFilterButton } from "@/components/ui/list-page-filter-button";
import {
  LIST_PAGE_SEARCH_INPUT_CLASS,
  ListPageToolbar,
} from "@/components/ui/list-page-toolbar";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleIdInSet,
  toggleSelectAllRows,
} from "@/lib/business/list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { PanelFormInput } from "@/lib/schemas/panel";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { TABLE_HEAD_CELL_CLASS } from "@/lib/ui/table-head-styles";

export type PanelRow = {
  documentId: string;
  name: string;
  slug: string;
  stepId: string;
  stepName: string;
  teamIds: string[];
  teamNames: string[];
  active: boolean;
};

export interface PanelManagerProps {
  panels: PanelRow[];
  steps: PanelStepOption[];
  teams: TargetOption[];
  onCreate: (values: PanelFormInput) => void | Promise<void>;
  onUpdate: (
    documentId: string,
    values: PanelFormInput,
  ) => void | Promise<void>;
  onBulkArchive: (
    documentIds: string[],
    reason: string,
  ) => void | Promise<void>;
  onBulkReactivate: (documentIds: string[]) => void | Promise<void>;
  onBulkDelete: (documentIds: string[]) => void | Promise<void>;
}

const TABLE_BODY_CELL_CLASS = "py-2";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; panel: PanelRow };

function emptyForm(steps: PanelStepOption[]): PanelFormInput {
  return {
    name: "",
    slug: "",
    stepId: steps[0]?.id ?? "",
    teamIds: [],
  };
}

function toFormValues(panel: PanelRow): PanelFormInput {
  return {
    name: panel.name,
    slug: panel.slug,
    stepId: panel.stepId,
    teamIds: panel.teamIds,
  };
}

function saveErrorMessage(error: unknown, fallback: string, taken: string): string {
  if (error instanceof Error && error.message === "slugTaken") return taken;
  return fallback;
}

export function PanelManager({
  panels,
  steps,
  teams,
  onCreate,
  onUpdate,
  onBulkArchive,
  onBulkReactivate,
  onBulkDelete,
}: PanelManagerProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const tPanel = useTranslations("settings.panel");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const listResetKey = panels
    .map((row) => `${row.documentId}:${row.active ? "1" : "0"}`)
    .join(",");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setSelectedIds([]);
  }

  const visiblePanels = panels.filter((panel) => {
    if (panel.active === showArchived) return false;
    const needle = searchQuery.trim().toLowerCase();
    if (needle.length === 0) return true;
    return (
      panel.name.toLowerCase().includes(needle) ||
      panel.slug.toLowerCase().includes(needle)
    );
  });

  const selectedPanels = selectedRowsFromList(visiblePanels, selectedIds);
  const hasSelection = selectedPanels.length > 0;
  const allSelectedArchived = areAllSelectedRowsInactive(
    selectedPanels,
    (row) => !row.active,
  );
  const showArchiveAction = hasSelection && !allSelectedArchived;
  const showDeleteAction = hasSelection && allSelectedArchived;
  const showRestoreAction = hasSelection && allSelectedArchived;

  function closeModal(): void {
    setModal({ mode: "closed" });
  }

  function openEdit(panel: PanelRow): void {
    setModal({ mode: "edit", panel });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) => toggleSelectAllRows(visiblePanels, current));
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleSave(values: PanelFormInput): void {
    startTransition(async () => {
      try {
        if (modal.mode === "edit") {
          await onUpdate(modal.panel.documentId, values);
        } else if (modal.mode === "create") {
          await onCreate(values);
        }
        showSuccessToast(tPanel("saved"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(
          saveErrorMessage(error, tPanel("saveError"), tPanel("slugTaken")),
        );
      }
    });
  }

  function handleBulkArchiveConfirm(reason: string): void {
    startTransition(async () => {
      try {
        await onBulkArchive(selectedIds, reason);
        showSuccessToast(tPanel("archived"));
        setBulkArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPanel("archiveError"));
      }
    });
  }

  function handleBulkDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await onBulkDelete(selectedIds);
        showSuccessToast(tPanel("deleted"));
        setBulkDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPanel("deleteError"));
      }
    });
  }

  function handleBulkRestoreSelected(): void {
    startTransition(async () => {
      try {
        await onBulkReactivate(selectedIds);
        showSuccessToast(tPanel("reactivated"));
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tPanel("archiveError"));
      }
    });
  }

  const formKey =
    modal.mode === "edit" ? `panel-edit-${modal.panel.documentId}` : "panel-create";
  const defaultValues =
    modal.mode === "edit" ? toFormValues(modal.panel) : emptyForm(steps);
  const slugLocked = modal.mode === "edit";

  const selectionValue = {
    selectedIds,
    allSelected: areAllRowsSelected(visiblePanels, selectedIds),
    onToggleSelect: handleToggleSelect,
    onToggleSelectAll: handleToggleSelectAll,
  };

  const bulkToolbar =
    showArchiveAction || showRestoreAction || showDeleteAction ? (
      <BulkListToolbar
        showArchive={showArchiveAction}
        showRestore={showRestoreAction}
        showDelete={showDeleteAction}
        archiveLabel={tSettings("archiveSelected")}
        restoreLabel={tSettings("restoreSelected")}
        deleteLabel={tSettings("deleteSelected")}
        disabled={isPending}
        onArchive={() => setBulkArchiveOpen(true)}
        onRestore={handleBulkRestoreSelected}
        onDelete={() => setBulkDeleteOpen(true)}
      />
    ) : null;

  return (
    <ListPageActionsProvider>
      <ListSelectionProvider value={selectionValue}>
        <section className="space-y-4">
          {panels.length > 0 ? (
            <>
              <ListPageToolbar
                search={
                  <ListNameSearch
                    label={tPanel("search")}
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className={LIST_PAGE_SEARCH_INPUT_CLASS}
                  />
                }
                filterButton={
                  <ListPageFilterButton
                    ariaLabel={tPanel("filters")}
                    onClick={() => setFiltersOpen(true)}
                  />
                }
                trailingActions={
                  <AddNewButton
                    label={tPanel("new")}
                    disabled={isPending}
                    onClick={() => setModal({ mode: "create" })}
                  />
                }
              />
              {bulkToolbar ? (
                <ListPageActionsPortal>{bulkToolbar}</ListPageActionsPortal>
              ) : null}
              {filtersOpen ? (
                <PanelArchivedFilterModal
                  initialShowArchived={showArchived}
                  onClose={() => setFiltersOpen(false)}
                  onApply={setShowArchived}
                />
              ) : null}
            </>
          ) : (
            <div className="flex justify-end">
              <AddNewButton
                label={tPanel("new")}
                disabled={isPending}
                onClick={() => setModal({ mode: "create" })}
              />
            </div>
          )}

          {visiblePanels.length === 0 ? (
            <p className="text-muted-foreground py-6 text-sm">{tPanel("empty")}</p>
          ) : (
            <>
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b">
                    <th className="w-10 py-2 text-center">
                      <ListRowCheckbox
                        documentId=""
                        variant="table-header"
                        selectAll
                        ariaLabel={tCommon("selectAll")}
                      />
                    </th>
                    <th className={TABLE_HEAD_CELL_CLASS}>
                      {tPanel("columns.name")}
                    </th>
                    <th className={TABLE_HEAD_CELL_CLASS}>
                      {tPanel("columns.slug")}
                    </th>
                    <th className={TABLE_HEAD_CELL_CLASS}>
                      {tPanel("columns.step")}
                    </th>
                    <th className={TABLE_HEAD_CELL_CLASS}>
                      {tPanel("columns.teams")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePanels.map((panel) => (
                    <tr
                      key={panel.documentId}
                      role="button"
                      tabIndex={0}
                      aria-label={tPanel("open", { name: panel.name })}
                      className="cursor-pointer border-b hover:bg-muted/40"
                      onClick={() => openEdit(panel)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEdit(panel);
                        }
                      }}
                    >
                      <ListRowCheckbox
                        documentId={panel.documentId}
                        variant="table"
                        ariaLabel={tCommon("selectRow", { name: panel.name })}
                      />
                      <td className={TABLE_BODY_CELL_CLASS}>
                        <span className="font-medium">{panel.name}</span>
                        {panel.active ? null : (
                          <CardBadge className="ml-2">
                            {tPanel("inactive")}
                          </CardBadge>
                        )}
                      </td>
                      <td className={TABLE_BODY_CELL_CLASS}>
                        <span className="text-muted-foreground">
                          /panel/{panel.slug}
                        </span>
                        {panel.active ? (
                          <Link
                            href={`/panel/${panel.slug}`}
                            className="ml-2 text-primary underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {tPanel("preview")}
                          </Link>
                        ) : null}
                      </td>
                      <td className={TABLE_BODY_CELL_CLASS}>{panel.stepName}</td>
                      <td className={TABLE_BODY_CELL_CLASS}>
                        {panel.teamNames.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="md:hidden">
                {visiblePanels.map((panel) => (
                  <li
                    key={panel.documentId}
                    className="flex items-start gap-3 border-b py-3"
                  >
                    <ListRowCheckbox
                      documentId={panel.documentId}
                      variant="mobile"
                      ariaLabel={tCommon("selectRow", { name: panel.name })}
                    />
                    <button
                      type="button"
                      className="w-full text-left no-underline"
                      aria-label={tPanel("open", { name: panel.name })}
                      onClick={() => openEdit(panel)}
                    >
                      <span className="text-base font-medium">{panel.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        /panel/{panel.slug} · {panel.stepName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <PanelFormModal
            open={modal.mode !== "closed"}
            title={modal.mode === "edit" ? tPanel("edit") : tPanel("new")}
            formKey={formKey}
            defaultValues={defaultValues}
            slugLocked={slugLocked}
            steps={steps}
            teams={teams}
            saving={isPending}
            onClose={closeModal}
            onSave={handleSave}
          />

          <ArchiveReasonModal
            open={bulkArchiveOpen}
            title={tPanel("bulkArchiveTitle")}
            description={tPanel.rich("bulkArchiveConfirm", {
              count: selectedPanels.length,
              b: (chunks) => <b>{chunks}</b>,
            })}
            count={selectedIds.length}
            disabled={isPending}
            titleId="panels-bulk-archive-title"
            onConfirm={handleBulkArchiveConfirm}
            onClose={() => setBulkArchiveOpen(false)}
          />

          <ConfirmDialog
            open={bulkDeleteOpen}
            title={tPanel("bulkDeleteTitle")}
            description={tPanel("bulkDeleteConfirm")}
            confirmLabel={tCommon("delete")}
            disabled={isPending}
            onConfirm={handleBulkDeleteConfirm}
            onClose={() => setBulkDeleteOpen(false)}
          />
        </section>
      </ListSelectionProvider>
    </ListPageActionsProvider>
  );
}
