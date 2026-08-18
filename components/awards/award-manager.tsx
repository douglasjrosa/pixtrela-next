"use client";

import {
  Suspense,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { AddNewButton } from "@/components/ui/add-new-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";

import { AwardListProvider } from "./award-list-context";
import { AwardsToolbar } from "./awards-toolbar";
import {
  currencyLabel,
  type AwardRow,
  type CurrencyOption,
} from "./types";

export type { AwardRow, CurrencyOption } from "./types";

export interface AwardManagerProps {
  currencies: CurrencyOption[];
  children: ReactNode;
  onCreate: (values: AwardFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: AwardFormInput) => void | Promise<void>;
  onArchive: (documentId: string) => void | Promise<void>;
  onHardDelete: (documentId: string) => void | Promise<void>;
  onUploadImage: (formData: FormData) => Promise<number | string>;
  /** When false, catalog is read-only (manager view). */
  canManage?: boolean;
  canDeactivate?: boolean;
  canDelete: boolean;
}

function defaultValues(currencies: CurrencyOption[]): AwardFormInput {
  const defaultCurrencyId = currencies[0]?.documentId ?? "";
  return {
    name: "",
    title: "",
    description: "",
    warnings: "",
    imageId: null,
    showInStore: true,
    stock: 0,
    values: [{ numberOf: 1, currencyDocumentId: defaultCurrencyId }],
  };
}

function toFormValues(
  award: AwardRow,
  currencies: CurrencyOption[],
): AwardFormInput {
  return {
    name: award.name,
    title: award.title ?? "",
    description: award.description ?? "",
    warnings: award.warnings ?? "",
    imageId: award.imageId ?? null,
    showInStore: award.showInStore,
    stock: award.stock,
    values:
      award.values.length > 0
        ? award.values
        : [{ numberOf: 1, currencyDocumentId: currencies[0]?.documentId ?? "" }],
  };
}

interface AwardFormDialogProps {
  editingAward: AwardRow | null;
  currencies: CurrencyOption[];
  isPending: boolean;
  readOnly: boolean;
  destructiveAction?: "archive" | "delete";
  onClose: () => void;
  onSubmit: (values: AwardFormInput) => void;
  onDestructiveAction?: () => void;
  onUploadImage: (formData: FormData) => Promise<number | string>;
}

function AwardFormDialog({
  editingAward,
  currencies,
  isPending,
  readOnly,
  destructiveAction,
  onClose,
  onSubmit,
  onDestructiveAction,
  onUploadImage,
}: AwardFormDialogProps) {
  const tCommon = useTranslations("common");
  const tAwards = useTranslations("awards");
  const isEditing = editingAward !== null;
  const formDisabled = isPending || readOnly;
  const formTitleId = "award-form-title";
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    editingAward?.imageUrl ?? null,
  );
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [, startUploadTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AwardFormInput>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: isEditing
      ? toFormValues(editingAward, currencies)
      : defaultValues(currencies),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  const imageId = useWatch({ control, name: "imageId" });

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    startUploadTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const id = await onUploadImage(formData);
        setValue("imageId", id);
        setUploadMessage(tAwards("imageSelected"));
      } catch {
        setPreviewUrl(editingAward?.imageUrl ?? null);
        setValue("imageId", editingAward?.imageId ?? null);
        setUploadMessage(tAwards("imageUploadFailed"));
      }
    });
  }

  const textareaClass = cn(
    "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2",
    "text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
    "disabled:opacity-50",
  );
  const formId = "award-form";

  return (
    <FormModalShell
      open
      size="lgNarrow"
      title={isEditing ? tAwards("editAward") : tAwards("newAward")}
      titleId={formTitleId}
      onClose={onClose}
      disabled={isPending}
      footerStart={
        destructiveAction && onDestructiveAction ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDestructiveAction}
          >
            {destructiveAction === "archive"
              ? tAwards("archive")
              : tCommon("delete")}
          </Button>
        ) : undefined
      }
      footerEnd={
        readOnly ? undefined : (
          <Button
            type="submit"
            form={formId}
            disabled={isPending || currencies.length === 0}
          >
            {tCommon("save")}
          </Button>
        )
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
      >
        {uploadMessage ? (
          <p
            role="status"
            className="sm:col-span-2 text-sm text-muted-foreground"
          >
            {uploadMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="name">{tAwards("name")}</Label>
          <Input id="name" disabled={formDisabled} {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{tAwards("titleField")}</Label>
          <Input id="title" disabled={formDisabled} {...register("title")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{tAwards("description")}</Label>
          <textarea
            id="description"
            className={textareaClass}
            disabled={formDisabled}
            {...register("description")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="warnings">{tAwards("warnings")}</Label>
          <textarea
            id="warnings"
            className={textareaClass}
            disabled={formDisabled}
            {...register("warnings")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image">{tAwards("image")}</Label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                disabled={formDisabled}
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">
                {tAwards("imageHint")}
              </p>
              {imageId ? (
                <p className="text-xs text-muted-foreground">
                  {tAwards("imageAttached")}
                </p>
              ) : null}
            </div>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
              <img
                src={previewUrl}
                alt=""
                role="presentation"
                className="h-24 w-24 shrink-0 rounded-md border object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-4 sm:col-span-2">
          <Label>{tAwards("values")}</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap gap-2">
              <Input
                type="number"
                min={1}
                className="w-28"
                disabled={formDisabled}
                aria-label={tAwards("numberOf")}
                {...register(`values.${index}.numberOf`, { valueAsNumber: true })}
              />
              <select
                className={
                  "flex h-9 min-w-40 flex-1 rounded-md border border-input " +
                  "bg-transparent px-3 text-sm"
                }
                disabled={formDisabled}
                aria-label={tAwards("currency")}
                {...register(`values.${index}.currencyDocumentId`)}
              >
                {currencies.map((currency) => (
                  <option key={currency.documentId} value={currency.documentId}>
                    {currencyLabel(currency)}
                  </option>
                ))}
              </select>
              {fields.length > 1 && !readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  {tCommon("delete")}
                </Button>
              ) : null}
            </div>
          ))}
          {!readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  numberOf: 1,
                  currencyDocumentId: currencies[0]?.documentId ?? "",
                })
              }
            >
              {tAwards("addValue")}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className={cn("size-4 rounded border accent-primary")}
              disabled={formDisabled}
              {...register("showInStore")}
            />
            {tAwards("showInStore")}
          </label>
          <div className="space-y-2">
            <Label htmlFor="stock">{tAwards("stock")}</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              className="w-32"
              disabled={formDisabled}
              {...register("stock", { valueAsNumber: true })}
            />
            {errors.stock ? (
              <p className="text-sm text-destructive">{errors.stock.message}</p>
            ) : null}
          </div>
        </div>
      </form>
    </FormModalShell>
  );
}

export function AwardManager({
  currencies,
  children,
  onCreate,
  onUpdate,
  onArchive,
  onHardDelete,
  onUploadImage,
  canManage = true,
  canDeactivate = false,
  canDelete,
}: AwardManagerProps) {
  const tCommon = useTranslations("common");
  const tAwards = useTranslations("awards");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const canOpenEdit = canManage || canDeactivate;
  const destructiveAction = editingAward
    ? editingAward.active
      ? canDeactivate
        ? ("archive" as const)
        : undefined
      : canDelete
        ? ("delete" as const)
        : undefined
    : undefined;

  function closeForm(): void {
    setFormOpen(false);
    setEditingAward(null);
    setConfirmOpen(false);
  }

  function startCreate(): void {
    setEditingAward(null);
    setMessage(null);
    setConfirmOpen(false);
    setFormOpen(true);
  }

  function startEdit(award: AwardRow): void {
    setEditingAward(award);
    setMessage(null);
    setConfirmOpen(false);
    setFormOpen(true);
  }

  function onSubmit(values: AwardFormInput): void {
    if (!canManage) return;
    startTransition(async () => {
      if (editingAward) {
        await onUpdate(editingAward.documentId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tAwards("saved"));
      closeForm();
      router.refresh();
    });
  }

  function handleConfirmDestructive(): void {
    if (!editingAward || !destructiveAction) return;
    startTransition(async () => {
      if (destructiveAction === "archive") {
        await onArchive(editingAward.documentId);
        setMessage(tAwards("archived"));
      } else {
        await onHardDelete(editingAward.documentId);
        setMessage(tAwards("deleted"));
      }
      closeForm();
      router.refresh();
    });
  }

  const formDialogKey = editingAward?.documentId ?? "new";

  return (
    <AwardListProvider openEdit={canOpenEdit ? startEdit : undefined}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 max-[500px]:gap-2">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-2xl font-bold max-[500px]:text-lg">
            {tAwards("title")}
          </h1>
          {canManage ? (
            <AddNewButton label={tAwards("newAward")} onClick={startCreate} />
          ) : null}
        </div>

        <Suspense fallback={null}>
          <AwardsToolbar />
        </Suspense>

        {message ? (
          <p role="status" className="shrink-0 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}

        {formOpen ? (
          <AwardFormDialog
            key={formDialogKey}
            editingAward={editingAward}
            currencies={currencies}
            isPending={isPending}
            readOnly={!canManage}
            destructiveAction={destructiveAction}
            onClose={closeForm}
            onSubmit={onSubmit}
            onDestructiveAction={
              destructiveAction ? () => setConfirmOpen(true) : undefined
            }
            onUploadImage={onUploadImage}
          />
        ) : null}

        <ConfirmDialog
          open={confirmOpen}
          title={
            destructiveAction === "archive"
              ? tAwards("archiveTitle")
              : tAwards("deleteTitle")
          }
          description={
            destructiveAction === "archive"
              ? tAwards("archiveConfirm")
              : tAwards("deleteConfirm")
          }
          confirmLabel={
            destructiveAction === "archive"
              ? tAwards("archive")
              : tCommon("delete")
          }
          disabled={isPending}
          onConfirm={handleConfirmDestructive}
          onClose={() => setConfirmOpen(false)}
        />

        {children}
      </div>
    </AwardListProvider>
  );
}
