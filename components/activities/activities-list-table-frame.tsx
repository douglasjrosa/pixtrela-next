"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  bulkDeactivateActivities,
  bulkDeleteActivities,
  loadActivityArchiveReason,
  loadMoreActivities,
  reactivateActivity,
  updateActivity,
} from "@/app/(app)/activities/actions";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { ListLoadMore } from "@/components/ui/load-more-button";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import { activityListFilterKey } from "@/lib/activities/activity-list-params";
import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleIdInSet,
  toggleSelectAllRows,
} from "@/lib/business/list-selection";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { ActivityFormOptions } from "@/lib/repos/activities";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import type { AdminActivityFormInput } from "@/lib/schemas/admin-activity";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { ActivityEditProvider } from "./activity-edit-context";
import { ActivityForm, activityFormValuesFromRow } from "./activity-form";
import {
  ActivityListRowPresentational,
  type ActivityListRowLabels,
} from "./activity-list-row-presentational";
import { ActivitiesBulkArchiveModal } from "./activities-bulk-archive-modal";
import type { ActivityRow } from "./types";

const EDIT_FORM_ID = "edit-activity-form";
const EDIT_TITLE_ID = "edit-activity-title";

function optionsForEdit(
  options: ActivityFormOptions,
  activity: ActivityRow,
): ActivityFormOptions {
  const colaborators = options.colaborators.some(
    (row) => row.id === activity.colaboratorId,
  )
    ? options.colaborators
    : [
        {
          id: activity.colaboratorId,
          name: activity.colaboratorName,
          code: activity.colaboratorCode,
        },
        ...options.colaborators,
      ];
  const subTasks = options.subTasks.some((row) => row.id === activity.subTaskId)
    ? options.subTasks
    : [
        {
          id: activity.subTaskId,
          name: activity.subTaskName,
          taskName: activity.taskName,
        },
        ...options.subTasks,
      ];
  return { colaborators, subTasks };
}

export interface ActivitiesListTableFrameProps {
  filters: ActivityListFilters;
  options: ActivityFormOptions;
  initialActivities: ActivityRow[];
  initialPage: number;
  initialHasMore: boolean;
  canDeactivate?: boolean;
  canDelete?: boolean;
  tableHeader: ReactNode;
  tableBody: ReactNode;
  mobileList: ReactNode;
}

function buildRowLabels(
  activity: ActivityRow,
  t: ReturnType<typeof useTranslations<"activities">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
): ActivityListRowLabels {
  return {
    inactive: t("inactive"),
    started: t("action.started"),
    stoped: t("action.stoped"),
    selectRow: tCommon("selectRow", { name: activity.colaboratorName }),
  };
}

export function ActivitiesListTableFrame({
  filters,
  options,
  initialActivities,
  initialPage,
  initialHasMore,
  canDeactivate = false,
  canDelete = false,
  tableHeader,
  tableBody,
  mobileList,
}: ActivitiesListTableFrameProps) {
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const filterKey = activityListFilterKey(filters);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [extraActivities, setExtraActivities] = useState<ActivityRow[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityRow | null>(null);
  const [archiveReason, setArchiveReason] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const listResetKey = `${filterKey}:${initialPage}:${initialHasMore}`;
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setExtraActivities([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }

  const activities = [...initialActivities, ...extraActivities];
  const selected = selectedRowsFromList(activities, selectedIds);
  const hasSelection = selected.length > 0;
  const allSelectedArchived = areAllSelectedRowsInactive(
    selected,
    (row) => !row.active,
  );
  const showArchiveAction = hasSelection && !allSelectedArchived && canDeactivate;
  const showDeleteAction = hasSelection && allSelectedArchived && canDelete;

  function handleLoadMore(): void {
    const nextPage = page + 1;
    startTransition(async () => {
      try {
        const result = await loadMoreActivities(filters, nextPage);
        setExtraActivities((current) => [...current, ...result.activities]);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function openEdit(activity: ActivityRow): void {
    setEditing(activity);
    setArchiveReason(null);
    if (activity.active) return;
    startTransition(async () => {
      try {
        const reason = await loadActivityArchiveReason(activity.documentId);
        setArchiveReason(reason);
      } catch (error) {
        rethrowIfNavigationError(error);
        setArchiveReason(null);
      }
    });
  }

  function handleUpdate(values: AdminActivityFormInput): void {
    if (!editing) return;
    startTransition(async () => {
      try {
        await updateActivity(editing.documentId, values);
        showSuccessToast(t("saved"));
        setEditing(null);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleReactivate(): void {
    if (!editing) return;
    startTransition(async () => {
      try {
        await reactivateActivity(editing.documentId);
        showSuccessToast(t("reactivated"));
        setEditing(null);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleArchiveConfirm(reasonForDeactivation: string): void {
    startTransition(async () => {
      try {
        await bulkDeactivateActivities(selectedIds, reasonForDeactivation);
        showSuccessToast(t("bulkArchived"));
        setArchiveOpen(false);
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await bulkDeleteActivities(selectedIds);
        showSuccessToast(t("bulkDeleted"));
        setDeleteOpen(false);
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  const selectionValue = bulkEnabled
    ? {
        selectedIds,
        allSelected: areAllRowsSelected(activities, selectedIds),
        onToggleSelect: (documentId: string) => {
          setSelectedIds((current) => toggleIdInSet(current, documentId));
        },
        onToggleSelectAll: () => {
          setSelectedIds((current) => toggleSelectAllRows(activities, current));
        },
      }
    : null;

  return (
    <ActivityEditProvider onEdit={openEdit}>
      <ListSelectionProvider value={selectionValue}>
        <div className="flex min-h-0 flex-1 flex-col">
          {bulkEnabled ? (
            <BulkListToolbar
              showArchive={showArchiveAction}
              showDelete={showDeleteAction}
              archiveLabel={t("archiveSelected")}
              deleteLabel={t("deleteSelected")}
              disabled={isPending}
              onArchive={() => setArchiveOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="hidden w-full text-sm md:table">
              {tableHeader}
              {tableBody}
              {extraActivities.length > 0 ? (
                <tbody>
                  {extraActivities.map((activity) => (
                    <ActivityListRowPresentational
                      key={activity.documentId}
                      activity={activity}
                      variant="table"
                      labels={buildRowLabels(activity, t, tCommon)}
                      showCheckboxColumn={showCheckboxColumn}
                    />
                  ))}
                </tbody>
              ) : null}
            </table>
            {mobileList}
            {extraActivities.length > 0 ? (
              <ul className="md:hidden">
                {extraActivities.map((activity) => (
                  <ActivityListRowPresentational
                    key={activity.documentId}
                    activity={activity}
                    variant="mobile"
                    labels={buildRowLabels(activity, t, tCommon)}
                    showCheckboxColumn={showCheckboxColumn}
                  />
                ))}
              </ul>
            ) : null}
          </div>

          <ListLoadMore
            visible={hasMore}
            loading={isPending}
            onClick={handleLoadMore}
          />

          <ActivitiesBulkArchiveModal
            open={archiveOpen}
            disabled={isPending}
            count={selectedIds.length}
            onClose={() => setArchiveOpen(false)}
            onConfirm={handleArchiveConfirm}
          />
          <ConfirmDialog
            open={deleteOpen}
            title={t("bulkDeleteTitle")}
            description={t("bulkDeleteConfirm")}
            confirmLabel={t("delete")}
            disabled={isPending}
            onConfirm={handleDeleteConfirm}
            onClose={() => setDeleteOpen(false)}
          />
          {editing ? (
            <FormModalShell
              open
              title={t("editActivity")}
              titleId={EDIT_TITLE_ID}
              onClose={() => setEditing(null)}
              disabled={isPending}
              fillBody={false}
              footerStart={
                !editing.active && canDeactivate ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleReactivate}
                  >
                    {t("reactivate")}
                  </Button>
                ) : null
              }
              footerEnd={
                <Button type="submit" form={EDIT_FORM_ID} disabled={isPending}>
                  {tCommon("save")}
                </Button>
              }
            >
              {!editing.active && archiveReason ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("archiveReason", { reason: archiveReason })}
                </p>
              ) : null}
              <ActivityForm
                options={optionsForEdit(options, editing)}
                defaultValues={activityFormValuesFromRow(editing)}
                formId={EDIT_FORM_ID}
                isPending={isPending}
                onSubmit={handleUpdate}
                onInvalid={() => showErrorToast(t("validationError"))}
              />
            </FormModalShell>
          ) : null}
        </div>
      </ListSelectionProvider>
    </ActivityEditProvider>
  );
}
