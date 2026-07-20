"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CurrencyFormModal } from "@/components/settings/currency-form-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { CurrencyFormInput } from "@/lib/schemas/currency";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface CurrencyRow {
  documentId: string;
  name: string;
  title: string;
  pluralTitle: string;
  iconMediaId: number | null;
  iconMediaUrl: string | null;
  currencyPerSecond: number;
}

export interface CurrencyManagerProps {
  currencies: CurrencyRow[];
  onCreate: (values: CurrencyFormInput) => void | Promise<void>;
  onUpdate: (
    documentId: string,
    values: CurrencyFormInput,
  ) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
  onUploadIcon: (formData: FormData) => Promise<number>;
}

const EMPTY_FORM: CurrencyFormInput = {
  name: "",
  title: "",
  pluralTitle: "",
  iconMediaId: null,
  currencyPerSecond: 0,
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

export function CurrencyManager({
  currencies,
  onCreate,
  onUpdate,
  onDelete,
  onUploadIcon,
}: CurrencyManagerProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function closeModal(): void {
    setModal({ mode: "closed" });
    setDeleteOpen(false);
  }

  function openEdit(currency: CurrencyRow): void {
    setModal({ mode: "edit", currency });
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
        showErrorToast(tSettings("currencyDeleteError"));
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{tSettings("currency")}</h2>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setModal({ mode: "create" })}
        >
          {tSettings("newCurrency")}
        </Button>
      </div>

      {currencies.length === 0 ? (
        <p className="text-muted-foreground py-6 text-sm">
          {tSettings("noCurrencies")}
        </p>
      ) : (
        <>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">{tSettings("currencyTitle")}</th>
                <th>{tSettings("currencyName")}</th>
                <th>{tSettings("currencyPerSecond")}</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => {
                const title = displayTitle(currency);
                return (
                  <tr
                    key={currency.documentId}
                    className="cursor-pointer border-b hover:bg-muted/40"
                    onClick={() => openEdit(currency)}
                  >
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        aria-label={tSettings("openCurrency", { name: title })}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(currency);
                        }}
                      >
                        {title}
                      </button>
                    </td>
                    <td className="text-muted-foreground">{currency.name}</td>
                    <td>{formatRate(currency.currencyPerSecond)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="md:hidden">
            {currencies.map((currency) => {
              const title = displayTitle(currency);
              return (
                <li key={currency.documentId} className="border-b py-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    aria-label={tSettings("openCurrency", { name: title })}
                    onClick={() => openEdit(currency)}
                  >
                    <span className="text-base font-medium">{title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {currency.name} · {formatRate(currency.currencyPerSecond)}
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
        showDelete={modal.mode === "edit"}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onUploadIcon={onUploadIcon}
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
    </section>
  );
}
