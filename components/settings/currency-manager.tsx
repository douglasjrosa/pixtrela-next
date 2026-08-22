"use client";

import { useState, useTransition } from "react";
import { Currency } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CurrencyFormModal } from "@/components/settings/currency-form-modal";
import { AddNewButton } from "@/components/ui/add-new-button";
import { ListCircleThumb } from "@/components/ui/list-circle-thumb";
import { BulkListToolbar } from "@/components/ui/bulk-list-toolbar";
import { ListArchivedToggle } from "@/components/ui/list-archived-toggle";
import { ListFiltersBar } from "@/components/ui/list-filters-bar";
import { ListNameSearch } from "@/components/ui/list-name-search";
import { CardBadge } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { ListSelectionProvider } from "@/components/ui/list-selection-context";
import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleIdInSet,
  toggleSelectAllRows,
} from "@/lib/business/list-selection";
import { isProtectedCurrencyDocument } from "@/lib/business/primary-currency";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { MediaAssetRecord } from "@/lib/repos/media";
import type { CurrencyFormInput } from "@/lib/schemas/currency";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface CurrencyRow {
  documentId: string;
  name: string;
  title: string;
  pluralTitle: string;
  iconMediaId: number | string | null;
  iconMediaUrl: string | null;
  currencyPerSecond: number;
  exchangeRate: number;
  active: boolean;
}

export interface CurrencyManagerProps {
  currencies: CurrencyRow[];
  protectedCurrencyId?: string | null;
  onCreate: (values: CurrencyFormInput) => void | Promise<void>;
  onUpdate: (
    documentId: string,
    values: CurrencyFormInput,
  ) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
  onBulkArchive: (documentIds: string[]) => void | Promise<void>;
  onBulkDelete: (documentIds: string[]) => void | Promise<void>;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
}

const EMPTY_FORM: CurrencyFormInput = {
  name: "",
  title: "",
  pluralTitle: "",
  iconMediaId: null,
  currencyPerSecond: 0,
  exchangeRate: 0,
};

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; currency: CurrencyRow };

function toFormValues(currency: CurrencyRow): CurrencyFormInput {
  return {
    name: currency.name,
    title: currency.title,
    pluralTitle: currency.pluralTitle,
    iconMediaId: currency.iconMediaId,
    currencyPerSecond: currency.currencyPerSecond,
    exchangeRate: currency.exchangeRate,
  };
}

function displayTitle(currency: CurrencyRow): string {
  if (currency.title.trim().length > 0) return currency.title;
  if (currency.pluralTitle.trim().length > 0) return currency.pluralTitle;
  return currency.name;
}

function formatRate(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function actionErrorMessage(
  error: unknown,
  fallback: string,
  primaryProtected: string,
): string {
  if (error instanceof Error && error.message === "primaryCurrencyProtected") {
    return primaryProtected;
  }
  return fallback;
}

export function CurrencyManager({
  currencies,
  protectedCurrencyId = null,
  onCreate,
  onUpdate,
  onDelete,
  onBulkArchive,
  onBulkDelete,
  onListImages,
  onUploadImage,
}: CurrencyManagerProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  const listResetKey = currencies
    .map((row) => `${row.documentId}:${row.active ? "1" : "0"}`)
    .join(",");
  const [prevListResetKey, setPrevListResetKey] = useState(listResetKey);
  if (listResetKey !== prevListResetKey) {
    setPrevListResetKey(listResetKey);
    setSelectedIds([]);
  }

  const visibleCurrencies = currencies.filter((currency) => {
    if (!showArchived && !currency.active) return false;
    const needle = searchQuery.trim().toLowerCase();
    if (needle.length === 0) return true;
    const title = displayTitle(currency).toLowerCase();
    return (
      title.includes(needle) || currency.name.toLowerCase().includes(needle)
    );
  });

  const selectedCurrencies = selectedRowsFromList(
    visibleCurrencies,
    selectedIds,
  );
  const hasSelection = selectedCurrencies.length > 0;
  const allSelectedArchived = areAllSelectedRowsInactive(
    selectedCurrencies,
    (row) => !row.active,
  );
  const showArchiveAction = hasSelection && !allSelectedArchived;
  const showDeleteAction = hasSelection && allSelectedArchived;

  function closeModal(): void {
    setModal({ mode: "closed" });
    setDeleteOpen(false);
  }

  function openEdit(currency: CurrencyRow): void {
    setModal({ mode: "edit", currency });
  }

  function handleToggleSelect(documentId: string): void {
    setSelectedIds((current) => toggleIdInSet(current, documentId));
  }

  function handleToggleSelectAll(): void {
    setSelectedIds((current) =>
      toggleSelectAllRows(visibleCurrencies, current),
    );
  }

  function clearSelection(): void {
    setSelectedIds([]);
  }

  function handleSave(values: CurrencyFormInput): void {
    startTransition(async () => {
      try {
        if (modal.mode === "edit") {
          await onUpdate(modal.currency.documentId, values);
        } else if (modal.mode === "create") {
          await onCreate(values);
        }
        showSuccessToast(tSettings("currencySaved"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tSettings("currencySaveError"));
      }
    });
  }

  function handleConfirmDelete(): void {
    if (modal.mode !== "edit") return;
    const documentId = modal.currency.documentId;
    startTransition(async () => {
      try {
        await onDelete(documentId);
        showSuccessToast(tSettings("currencyDeleted"));
        closeModal();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(
          actionErrorMessage(
            error,
            tSettings("currencyDeleteError"),
            tSettings("currencyPrimaryProtected"),
          ),
        );
      }
    });
  }

  function handleBulkArchiveConfirm(): void {
    startTransition(async () => {
      try {
        await onBulkArchive(selectedIds);
        showSuccessToast(tSettings("bulkArchived"));
        setBulkArchiveOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(
          actionErrorMessage(
            error,
            tSettings("currencyDeleteError"),
            tSettings("currencyPrimaryProtected"),
          ),
        );
      }
    });
  }

  function handleBulkDeleteConfirm(): void {
    startTransition(async () => {
      try {
        await onBulkDelete(selectedIds);
        showSuccessToast(tSettings("bulkDeleted"));
        setBulkDeleteOpen(false);
        clearSelection();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(
          actionErrorMessage(
            error,
            tSettings("currencyDeleteError"),
            tSettings("currencyPrimaryProtected"),
          ),
        );
      }
    });
  }

  const formKey =
    modal.mode === "edit"
      ? `currency-edit-${modal.currency.documentId}`
      : "currency-create";

  const defaultValues: CurrencyFormInput =
    modal.mode === "edit" ? toFormValues(modal.currency) : EMPTY_FORM;

  const initialIconUrl =
    modal.mode === "edit" ? modal.currency.iconMediaUrl : null;

  const selectionValue = {
    selectedIds,
    allSelected: areAllRowsSelected(visibleCurrencies, selectedIds),
    onToggleSelect: handleToggleSelect,
    onToggleSelectAll: handleToggleSelectAll,
  };

  function currencyIcon(currency: CurrencyRow) {
    const title = displayTitle(currency);
    return (
      <ListCircleThumb
        label={title}
        imageUrl={currency.iconMediaUrl}
        fallback={
          <Currency className="size-4 text-muted-foreground" aria-hidden />
        }
      />
    );
  }

  function titleCell(currency: CurrencyRow) {
    const title = displayTitle(currency);
    return (
      <>
        <span className="font-medium">{title}</span>
        {currency.active ? null : (
          <CardBadge className="ml-2">{tSettings("currencyInactive")}</CardBadge>
        )}
      </>
    );
  }

  return (
    <ListSelectionProvider value={selectionValue}>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{tSettings("currency")}</h2>
          <div className="flex items-center gap-2">
            <BulkListToolbar
              showArchive={showArchiveAction}
              showDelete={showDeleteAction}
              archiveLabel={tSettings("archiveSelected")}
              deleteLabel={tSettings("deleteSelected")}
              disabled={isPending}
              onArchive={() => setBulkArchiveOpen(true)}
              onDelete={() => setBulkDeleteOpen(true)}
            />
            <AddNewButton
              label={tSettings("newCurrency")}
              disabled={isPending}
              onClick={() => setModal({ mode: "create" })}
            />
          </div>
        </div>

        {currencies.length > 0 ? (
          <ListFiltersBar>
            <ListNameSearch
              label={tSettings("searchCurrencies")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <ListArchivedToggle
              label={tSettings("showArchivedCurrencies")}
              checked={showArchived}
              onChange={setShowArchived}
            />
          </ListFiltersBar>
        ) : null}

        {visibleCurrencies.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">
            {tSettings("noCurrencies")}
          </p>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b text-left">
                  <th className="w-10 py-2 text-center">
                    <ListRowCheckbox
                      documentId=""
                      variant="table-header"
                      selectAll
                      ariaLabel={tCommon("selectAll")}
                    />
                  </th>
                  <th className="w-12 py-2 pr-3" aria-hidden />
                  <th className="py-2">{tSettings("currencyTitle")}</th>
                  <th>{tSettings("currencyName")}</th>
                  <th>{tSettings("currencyPerSecond")}</th>
                  <th>{tSettings("currencyExchangeRate")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleCurrencies.map((currency) => {
                  const title = displayTitle(currency);
                  return (
                    <tr
                      key={currency.documentId}
                      role="button"
                      tabIndex={0}
                      aria-label={tSettings("openCurrency", { name: title })}
                      className="cursor-pointer border-b hover:bg-muted/40"
                      onClick={() => openEdit(currency)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEdit(currency);
                        }
                      }}
                    >
                      <ListRowCheckbox
                        documentId={currency.documentId}
                        variant="table"
                        ariaLabel={tCommon("selectRow", { name: title })}
                      />
                      <td className="w-12 py-2 pr-3">
                        {currencyIcon(currency)}
                      </td>
                      <td className="py-2">{titleCell(currency)}</td>
                      <td className="text-muted-foreground">{currency.name}</td>
                      <td>{formatRate(currency.currencyPerSecond)}</td>
                      <td>{formatRate(currency.exchangeRate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="md:hidden">
              {visibleCurrencies.map((currency) => {
                const title = displayTitle(currency);
                return (
                  <li
                    key={currency.documentId}
                    className="flex items-start gap-3 border-b py-3"
                  >
                    <ListRowCheckbox
                      documentId={currency.documentId}
                      variant="mobile"
                      ariaLabel={tCommon("selectRow", { name: title })}
                    />
                    {currencyIcon(currency)}
                    <button
                      type="button"
                      className="w-full text-left no-underline"
                      aria-label={tSettings("openCurrency", { name: title })}
                      onClick={() => openEdit(currency)}
                    >
                      <span className="text-base font-medium no-underline">
                        {titleCell(currency)}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {currency.name} ·{" "}
                        {formatRate(currency.currencyPerSecond)} ·{" "}
                        {formatRate(currency.exchangeRate)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <CurrencyFormModal
          open={modal.mode !== "closed"}
          title={
            modal.mode === "edit"
              ? tSettings("editCurrency")
              : tSettings("newCurrency")
          }
          formKey={formKey}
          defaultValues={defaultValues}
          initialIconUrl={initialIconUrl}
          saving={isPending}
          showDelete={
            modal.mode === "edit" &&
            !isProtectedCurrencyDocument(
              modal.currency.documentId,
              currencies,
              protectedCurrencyId,
            )
          }
          onClose={closeModal}
          onSave={handleSave}
          onDelete={() => setDeleteOpen(true)}
          onListImages={onListImages}
          onUploadImage={onUploadImage}
        />

        <ConfirmDialog
          open={deleteOpen}
          title={tSettings("currencyDeleteTitle")}
          description={tSettings("currencyDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteOpen(false)}
        />

        <ConfirmDialog
          open={bulkArchiveOpen}
          title={tSettings("bulkArchiveTitle")}
          description={tSettings.rich("bulkArchiveConfirm", {
            count: selectedCurrencies.length,
            b: (chunks) => <b>{chunks}</b>,
          })}
          confirmLabel={tCommon("yes")}
          cancelLabel={tCommon("cancel")}
          confirmVariant="default"
          disabled={isPending}
          onConfirm={handleBulkArchiveConfirm}
          onClose={() => setBulkArchiveOpen(false)}
        />

        <ConfirmDialog
          open={bulkDeleteOpen}
          title={tSettings("bulkDeleteTitle")}
          description={tSettings("bulkDeleteConfirm")}
          confirmLabel={tCommon("delete")}
          disabled={isPending}
          onConfirm={handleBulkDeleteConfirm}
          onClose={() => setBulkDeleteOpen(false)}
        />
      </section>
    </ListSelectionProvider>
  );
}
