"use client";

import {
  Suspense,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MediaImageField } from "@/components/media/media-image-field";
import { Button } from "@/components/ui/button";
import { AddNewButton } from "@/components/ui/add-new-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { SwitchField } from "@/components/ui/switch-field";
import { Textarea } from "@/components/ui/textarea";
import { buildAwardValuesForCurrencies } from "@/lib/awards/build-award-form-values";
import type { MediaAssetRecord } from "@/lib/repos/media";
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
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
  /** When false, catalog is read-only (manager view). */
  canManage?: boolean;
  canDeactivate?: boolean;
  canDelete: boolean;
}

function defaultValues(currencies: CurrencyOption[]): AwardFormInput {
  return {
    name: "",
    title: "",
    description: "",
    warnings: "",
    imageId: null,
    showInStore: true,
    stock: 0,
    actualPrice: 0,
    autoRecalculate: true,
    values: buildAwardValuesForCurrencies(currencies),
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
    actualPrice: award.actualPrice,
    autoRecalculate: award.autoRecalculate,
    values: buildAwardValuesForCurrencies(currencies, award.values),
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
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
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
  onListImages,
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

  const imageId = useWatch({ control, name: "imageId" });

  function handleImageConfirm(asset: MediaAssetRecord): void {
    setValue("imageId", asset.id);
    setPreviewUrl(asset.browserUrl);
  }

  function handleImageRemove(): void {
    setValue("imageId", null);
    setPreviewUrl(null);
  }

  const formId = "award-form";

  return (
    <FormModalShell
      open
      size="lgNarrow"
      bodyClassName="p-6"
      footerClassName="px-6 py-4"
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
        className="flex flex-col gap-8"
      >
        <div className="grid gap-6 gap-x-10 sm:grid-cols-2">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{tAwards("description")}</Label>
          <Textarea
            id="description"
            disabled={formDisabled}
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warnings">{tAwards("warnings")}</Label>
          <Textarea
            id="warnings"
            disabled={formDisabled}
            {...register("warnings")}
          />
        </div>

        <div className="space-y-2">
          <Label>{tAwards("image")}</Label>
          <MediaImageField
            selectedId={imageId}
            previewUrl={previewUrl}
            disabled={formDisabled}
            attachedLabel={tAwards("imageAttached")}
            onSelect={handleImageConfirm}
            onRemove={handleImageRemove}
            onListImages={onListImages}
            onUploadImage={onUploadImage}
          />
        </div>

        <div className="grid gap-6 gap-x-10 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stock">{tAwards("stock")}</Label>
            <NumberInput
              id="stock"
              min={0}
              disabled={formDisabled}
              {...register("stock", { valueAsNumber: true })}
            />
            {errors.stock ? (
              <p className="text-sm text-destructive">{errors.stock.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-price">{tAwards("actualPrice")}</Label>
            <NumberInput
              id="actual-price"
              step="0.01"
              disabled={formDisabled}
              {...register("actualPrice", { valueAsNumber: true })}
            />
            {errors.actualPrice ? (
              <p className="text-sm text-destructive">
                {errors.actualPrice.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Controller
            name="showInStore"
            control={control}
            render={({ field }) => (
              <SwitchField
                id="show-in-store"
                label={tAwards("showInStore")}
                checked={field.value}
                disabled={formDisabled}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="autoRecalculate"
            control={control}
            render={({ field }) => (
              <SwitchField
                id="auto-recalculate"
                label={tAwards("autoRecalculate")}
                checked={field.value}
                disabled={formDisabled}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold">{tAwards("values")}</h3>
          <div className="grid gap-6 gap-x-10 sm:grid-cols-2">
            {currencies.map((currency, index) => (
              <div key={currency.documentId} className="space-y-2">
                <Label htmlFor={`award-value-${currency.documentId}`}>
                  {currencyLabel(currency)}
                </Label>
                <input
                  type="hidden"
                  {...register(`values.${index}.currencyDocumentId`)}
                />
                <NumberInput
                  id={`award-value-${currency.documentId}`}
                  min={0}
                  disabled={formDisabled}
                  {...register(`values.${index}.numberOf`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
            ))}
          </div>
          {errors.values ? (
            <p className="text-sm text-destructive">{errors.values.message}</p>
          ) : null}
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
  onListImages,
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
            onListImages={onListImages}
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
